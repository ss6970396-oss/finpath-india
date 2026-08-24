from contextlib import asynccontextmanager
import glob
import json
import os
from pathlib import Path
import re
import traceback

import db
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from google import genai
from google.genai import types
from nudge import analyse
from nudge import generate as generate_spending
from pgvector import Vector
from pydantic import BaseModel

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Switch to Flash model for higher RPM allowances on the free tier
CHAT_MODEL = "gemini-2.5-flash"
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIM = 768  # must match ingest.py and vector(768) in schema.sql

SOURCES_DELIM = "\n␟SOURCES␟"
NO_SOURCE_REPLY = "I don't have a verified source for that yet."
RELEVANCE_MAX_DISTANCE = 0.50

# --- IN-MEMORY CACHE (Saves API calls on repeated/preset queries) ---
_query_cache: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.ensure_schema()
    except Exception as exc:
        print(f"[startup] schema check skipped: {exc}")
    yield


app = FastAPI(title="FinPath India API", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
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


def _generation_failure_reason(exc: Exception) -> str:
    text = str(exc)
    if "RESOURCE_EXHAUSTED" in text or "429" in text:
        retry = re.search(r"retry in ([\d.]+)s", text)
        wait = (
            f" Retry in about {round(float(retry.group(1)))}s."
            if retry
            else " Wait a minute before retrying."
        )
        return (
            "The model provider is rate-limiting this API key (HTTP 429): the free"
            f" tier allows only a few requests per minute.{wait}"
        )

    if "API_KEY" in text.upper() or "PERMISSION_DENIED" in text:
        return (
            "The model provider rejected the API key (check GOOGLE_API_KEY in"
            " backend/.env)."
        )

    first_line = text.strip().splitlines()[0] if text.strip() else "no detail"
    if len(first_line) > 200:
        first_line = f"{first_line[:200]}…"
    return f"{type(exc).__name__}: {first_line} (full traceback in the API log)."


def retrieve(query: str, k: int = 5) -> list[dict]:
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
    return text.strip().replace("’", "'").startswith(NO_SOURCE_REPLY)


def _meta_payload(hits: list[dict], mode: str, top_distance: float | None) -> str:
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


def _document_count() -> int | None:
    try:
        with db.connect() as conn:
            row = conn.execute("SELECT count(*) FROM documents").fetchone()
            return int(row[0]) if row else 0
    except Exception:
        return None


def _health_payload() -> dict:
    documents = _document_count()
    if documents is None:
        return {
            "status": "degraded",
            "service": "finpath-backend",
            "documents": None,
            "detail": (
                "API is up but the database is unreachable, so retrieval will refuse."
            ),
        }
    return {"status": "ok", "service": "finpath-backend", "documents": documents}


@app.get("/health")
def health_root():
    return _health_payload()


@app.get("/api/health")
def health():
    return _health_payload()


@app.post("/api/chat")
def chat(req: ChatRequest):
    norm_key = req.message.strip().lower()

    # Check in-memory cache first
    if norm_key in _query_cache:
        cached = _query_cache[norm_key]

        def cached_stream():
            yield cached["answer"]
            yield cached["meta"]

        return StreamingResponse(
            cached_stream(), media_type="text/plain; charset=utf-8"
        )

    try:
        hits = retrieve(req.message)
    except Exception as exc:
        print(f"[chat] retrieval failed: {exc}")
        hits = []

    top_distance = hits[0]["distance"] if hits else None

    if not hits:

        def no_context():
            yield NO_SOURCE_REPLY
            yield _meta_payload([], "grounded", None)

        return StreamingResponse(no_context(), media_type="text/plain; charset=utf-8")

    general = (top_distance is not None) and (top_distance > RELEVANCE_MAX_DISTANCE)
    if general:
        system_prompt = GENERAL_PROMPT
        prompt = f"QUESTION: {req.message}"
    else:
        context = "\n\n".join(
            f"[{h['n']}] {h['source']}, p.{h['page']}\n{h['content']}" for h in hits
        )
        system_prompt = SYSTEM_PROMPT
        prompt = f"CONTEXT:\n{context}\n\nQUESTION: {req.message}"

    def stream():
        answer = ""
        try:
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
        except Exception as exc:
            traceback.print_exc()
            print(f"[chat] generation failed: {type(exc).__name__}: {exc}")
            reason = _generation_failure_reason(exc)
            if answer:
                yield f"\n\n[The answer was cut short. {reason}]"
            else:
                yield f"The counsellor could not generate an answer. {reason}"
            yield _meta_payload([], "grounded", top_distance)
            return

        if general:
            meta = _meta_payload([], "general", top_distance)
        else:
            meta = _meta_payload(
                [] if _is_refusal(answer) else hits, "grounded", top_distance
            )

        # Save successfully generated answer to cache
        if answer and not _is_refusal(answer):
            _query_cache[norm_key] = {"answer": answer, "meta": meta}

        yield meta

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")


@app.get("/api/spending")
def spending(
    allowance: int = Query(12000, ge=1000, le=1_000_000),
    months: int = Query(1, ge=1, le=1),
):
    return analyse(generate_spending(months=months, allowance=allowance))


DATA_DIR = Path(__file__).with_name("data")


def _indexed_counts() -> dict[str, int]:
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
    for name, n in sorted(counts.items()):
        if not any(i["file"] == name for i in items):
            items.append({"file": name, "bytes": None, "chunks": n, "indexed": True})
    return {
        "documents": items,
        "total_chunks": sum(counts.values()),
        "index_ready": bool(counts),
    }


@app.get("/api/source/{name}")
def source_file(name: str):
    allowed = {os.path.basename(p) for p in glob.glob(str(DATA_DIR / "*.pdf"))}
    if name not in allowed:
        raise HTTPException(status_code=404, detail="Unknown source document")
    return FileResponse(DATA_DIR / name, media_type="application/pdf", filename=name)
