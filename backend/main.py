import glob
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pgvector import Vector

import db
from nudge import generate as generate_spending, analyse

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

CHAT_MODEL = "gemini-2.5-flash"
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIM = 768  # must match ingest.py and vector(768) in schema.sql

# The frontend (app/counselor/page.tsx) splits the response body on this
# sentinel and JSON-parses the tail. Do not change one side without the other.
# The tail is an object:
#   {mode: "grounded" | "general",
#    top_distance: float | null,
#    sources: [{n, source, page, snippet}]}
# — see _meta_payload().
SOURCES_DELIM = "\n␟SOURCES␟"

NO_SOURCE_REPLY = "I don't have a verified source for that yet."

# Cosine distance (pgvector `<=>`) of the nearest chunk, above which the corpus
# is treated as not covering the question and /api/chat answers from general
# knowledge instead — tagged as unverified, with no citations.
#
# Tuned against the live index, not guessed. Questions the corpus covers land
# at 0.26-0.42 (allowance budgeting 0.26, health insurance deductibles 0.42);
# questions with no financial content at all land at 0.48-0.56 (passport
# renewal 0.48, cricket world cup 0.56). 0.50 sits in that gap with headroom
# above the covered band, so a covered question is never demoted to general.
# Finance questions the corpus only half-covers stay on the grounded path by
# design: the grounded prompt's own NO_SOURCE_REPLY refusal is the right
# handler for "retrieved, but not answerable from what came back".
#
# Re-measure after ingesting more of the corpus — distances move as the index
# grows. backend/probe_threshold.py reproduces the numbers above.
RELEVANCE_MAX_DISTANCE = 0.50


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.ensure_schema()
    except Exception as exc:  # DB down — /api/health and /api/spending still work
        print(f"[startup] schema check skipped: {exc}")
    yield


app = FastAPI(title="FinPath India API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = f"""You are the FinPath India Counselor, a financial literacy
educator for Indian college students.

Answer ONLY from the CONTEXT block supplied with the question. The CONTEXT is
drawn from RBI, SEBI and NCFE publications.

RULES:
- If the CONTEXT does not contain the answer, reply with exactly this sentence
  and nothing else: {NO_SOURCE_REPLY}
- Cite inline as [1], [2] — the numbers refer to the numbered CONTEXT entries.
  Every factual claim needs a citation.
- NEVER name a specific stock, mutual fund, or company. Explain the category
  instead and say a SEBI-registered advisor handles specifics.
- Under 180 words.
- Simple language, everyday Indian examples (pocket money, UPI, canteen
  spending, hostel fees). Amounts in rupees.
- Never invent a rule, a number, or a source.
- Plain text only. No emoji, no decorative symbols, no markdown headings.
  Analytical and objective in tone.
"""


# Used when the nearest chunk sits further away than RELEVANCE_MAX_DISTANCE.
# Same guardrails as SYSTEM_PROMPT — the one rule that relaxes is answering
# from CONTEXT, because there is no usable CONTEXT to answer from.
GENERAL_PROMPT = """You are the FinPath India Counselor, a financial literacy
educator for Indian college students.

The index holds no passage close enough to this question, so answer from
general financial-literacy knowledge. The interface labels this answer as
unverified.

RULES:
- There are no sources. Never write [1], [2], and never name or quote RBI,
  SEBI, NCFE or any other document as though you had it in front of you.
- Stay on general principles and mechanics. Where the answer turns on a
  current rule, limit, rate or tax slab, say the figure needs checking against
  the regulator's latest circular rather than stating one.
- NEVER name a specific stock, mutual fund, or company. Explain the category
  instead and say a SEBI-registered advisor handles specifics.
- Under 180 words.
- Simple language, everyday Indian examples (pocket money, UPI, canteen
  spending, hostel fees). Amounts in rupees.
- Never invent a rule, a number, or a source. Say plainly when you are unsure.
- Plain text only. No emoji, no decorative symbols, no markdown headings.
  Analytical and objective in tone.
"""


class ChatRequest(BaseModel):
    message: str


def retrieve(query: str, k: int = 5) -> list[dict]:
    """Embed the query and pull the k nearest chunks by cosine distance.

    Each hit carries its own `distance`; the nearest one drives the grounded /
    general routing in chat().
    """
    resp = client.models.embed_content(
        model=EMBED_MODEL,
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIM),
    )
    vector = Vector(resp.embeddings[0].values)

    with db.connect() as conn:
        rows = conn.execute(
            "SELECT source, page, content, embedding <=> %s::vector AS distance "
            "FROM documents ORDER BY distance LIMIT %s",
            (vector, k),
        ).fetchall()

    return [
        {
            "n": n,
            "source": source,
            "page": page,
            "content": content,
            "distance": float(distance),
        }
        for n, (source, page, content, distance) in enumerate(rows, start=1)
    ]


def _is_refusal(text: str) -> bool:
    """True when the model returned the no-source sentence verbatim."""
    return text.strip().replace("’", "'").startswith(NO_SOURCE_REPLY)


def _meta_payload(
    hits: list[dict], mode: str, top_distance: float | None
) -> str:
    """Serialise the metadata tail of the streaming contract.

    `snippet` carries the retrieved chunk verbatim so the frontend's source
    drawer can show the exact clause an answer was drawn from, rather than
    only naming the document and page. `top_distance` is the distance of the
    nearest chunk retrieval saw — reported on every response, including the
    ungrounded ones, so the routing decision is inspectable from the client.
    """
    return SOURCES_DELIM + json.dumps(
        {
            "mode": mode,
            "top_distance": top_distance,
            "sources": [
                {
                    "n": h["n"],
                    "source": h["source"],
                    "page": h["page"],
                    "snippet": h["content"],
                }
                for h in hits
            ],
        }
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "finpath-backend"}


@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        hits = retrieve(req.message)
    except Exception as exc:
        print(f"[chat] retrieval failed: {exc}")
        hits = []

    top_distance = hits[0]["distance"] if hits else None

    # Nothing indexed, or the index is unreachable: refuse rather than let the
    # model answer ungrounded. This stays a refusal — an outage is not the same
    # as a corpus that genuinely does not cover the question, and answering
    # from general knowledge here would hide the outage.
    if not hits:
        def no_context():
            yield NO_SOURCE_REPLY
            yield _meta_payload([], "grounded", None)

        return StreamingResponse(
            no_context(), media_type="text/plain; charset=utf-8"
        )

    # The corpus was searched and nothing came back close enough: answer from
    # general knowledge, tagged as unverified and with no citations attached.
    general = top_distance > RELEVANCE_MAX_DISTANCE
    if general:
        print(
            f"[chat] general fallback, top distance {top_distance:.3f} "
            f"> {RELEVANCE_MAX_DISTANCE}"
        )
        system_prompt = GENERAL_PROMPT
        prompt = f"QUESTION: {req.message}"
    else:
        context = "\n\n".join(
            f"[{h['n']}] {h['source']}, p.{h['page']}\n{h['content']}"
            for h in hits
        )
        system_prompt = SYSTEM_PROMPT
        prompt = f"CONTEXT:\n{context}\n\nQUESTION: {req.message}"

    def stream():
        answer = ""
        for chunk in client.models.generate_content_stream(
            model=CHAT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
            ),
        ):
            if chunk.text:
                answer += chunk.text
                yield chunk.text

        if general:
            yield _meta_payload([], "general", top_distance)
        else:
            # Don't hang citation chips off a refusal.
            yield _meta_payload(
                [] if _is_refusal(answer) else hits, "grounded", top_distance
            )

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")


@app.get("/api/spending")
def spending(
    allowance: int = Query(12000, ge=1000, le=1_000_000),
    months: int = Query(1, ge=1, le=1),
):
    """Simulated month of UPI activity for the given monthly allowance.

    `allowance` drives the profile switcher in the frontend header. `months`
    is pinned to 1 because analyse() aggregates every transaction into a
    single monthly total — a wider window would silently inflate the ratios.
    """
    return analyse(generate_spending(months=months, allowance=allowance))


# --- Regulatory corpus ------------------------------------------------------
# The vault lists what the RAG index can actually cite. Metadata is read from
# disk and from the documents table — nothing about a document is invented.

DATA_DIR = Path(__file__).with_name("data")


def _indexed_counts() -> dict[str, int]:
    """chunks per source currently in the index; empty if the DB is down."""
    try:
        with db.connect() as conn:
            rows = conn.execute(
                "SELECT source, COUNT(*) FROM documents GROUP BY source"
            ).fetchall()
        return {src: n for src, n in rows}
    except Exception as exc:
        print(f"[sources] index lookup failed: {exc}")
        return {}


@app.get("/api/sources")
def sources():
    """Corpus in the ingest path, joined with its live index status."""
    counts = _indexed_counts()
    items = []
    for path in sorted(glob.glob(str(DATA_DIR / "*.pdf"))):
        name = os.path.basename(path)
        items.append(
            {
                "file": name,
                "bytes": os.path.getsize(path),
                "chunks": counts.get(name, 0),
                "indexed": counts.get(name, 0) > 0,
            }
        )
    # A source can be indexed while its file has been moved out of data/.
    for name, n in sorted(counts.items()):
        if not any(i["file"] == name for i in items):
            items.append(
                {"file": name, "bytes": None, "chunks": n, "indexed": True}
            )
    return {
        "documents": items,
        "total_chunks": sum(counts.values()),
        "index_ready": bool(counts),
    }


@app.get("/api/source/{name}")
def source_file(name: str):
    """Serve one corpus PDF for the citation inspector's preview pane.

    `name` is matched against the actual directory listing rather than being
    joined onto a path, so traversal (`../`) cannot escape DATA_DIR.
    """
    allowed = {os.path.basename(p) for p in glob.glob(str(DATA_DIR / "*.pdf"))}
    if name not in allowed:
        raise HTTPException(status_code=404, detail="Unknown source document")
    return FileResponse(
        DATA_DIR / name, media_type="application/pdf", filename=name
    )
