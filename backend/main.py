import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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
# sentinel and JSON-parses the tail into citation chips. Do not change one
# side without the other.
SOURCES_DELIM = "\n␟SOURCES␟"

NO_SOURCE_REPLY = "I don't have a verified source for that yet."


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
"""


class ChatRequest(BaseModel):
    message: str


def retrieve(query: str, k: int = 5) -> list[dict]:
    """Embed the query and pull the k nearest chunks by cosine distance."""
    resp = client.models.embed_content(
        model=EMBED_MODEL,
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIM),
    )
    vector = Vector(resp.embeddings[0].values)

    with db.connect() as conn:
        rows = conn.execute(
            "SELECT source, page, content FROM documents "
            "ORDER BY embedding <=> %s::vector LIMIT %s",
            (vector, k),
        ).fetchall()

    return [
        {"n": n, "source": source, "page": page, "content": content}
        for n, (source, page, content) in enumerate(rows, start=1)
    ]


def _is_refusal(text: str) -> bool:
    """True when the model returned the no-source sentence verbatim."""
    return text.strip().replace("’", "'").startswith(NO_SOURCE_REPLY)


def _sources_payload(hits: list[dict]) -> str:
    return SOURCES_DELIM + json.dumps(
        [{"n": h["n"], "source": h["source"], "page": h["page"]} for h in hits]
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

    # Nothing indexed, or the index is unreachable: refuse rather than let the
    # model answer ungrounded.
    if not hits:
        def no_context():
            yield NO_SOURCE_REPLY
            yield _sources_payload([])

        return StreamingResponse(
            no_context(), media_type="text/plain; charset=utf-8"
        )

    context = "\n\n".join(
        f"[{h['n']}] {h['source']}, p.{h['page']}\n{h['content']}" for h in hits
    )
    prompt = f"CONTEXT:\n{context}\n\nQUESTION: {req.message}"

    def stream():
        answer = ""
        for chunk in client.models.generate_content_stream(
            model=CHAT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
            ),
        ):
            if chunk.text:
                answer += chunk.text
                yield chunk.text

        # Don't hang citation chips off a refusal.
        yield _sources_payload([] if _is_refusal(answer) else hits)

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")


@app.get("/api/spending")
def spending():
    return analyse(generate_spending())
