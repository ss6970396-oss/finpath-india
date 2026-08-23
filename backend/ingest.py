import os, glob, time
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors
import db

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

BATCH = 20  # items per API call
PAUSE = 16  # seconds between calls -> ~75 items/min, under the 100 limit

splitter = RecursiveCharacterTextSplitter(
    chunk_size=900,
    chunk_overlap=150,
    separators=["\n\n", "\n", ". ", " "],
)


def embed(texts):
    """Embed with automatic backoff on rate limit."""
    for attempt in range(6):
        try:
            resp = client.models.embed_content(
                model="gemini-embedding-001",
                contents=texts,
                config=types.EmbedContentConfig(output_dimensionality=768),
            )
            return [e.values for e in resp.embeddings]
        except errors.ClientError as e:
            if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                wait = 60 * (attempt + 1)
                print(f"    rate limited — waiting {wait}s")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Gave up after repeated rate limits")


def main():
    db.ensure_schema()
    conn = db.connect()
    cur = conn.cursor()

    cur.execute("SELECT DISTINCT source FROM documents")
    done = {r[0] for r in cur.fetchall()}
    if done:
        print(f"Already indexed: {', '.join(sorted(done))}\n")

    files = sorted(glob.glob("data/*.pdf"))
    if not files:
        print("No PDFs in backend/data/")
        return

    for path in files:
        name = os.path.basename(path)
        if name in done:
            print(f"SKIP  {name} (already indexed)")
            continue

        print(f"\n>>> {name}")
        reader = PdfReader(path)
        rows = []
        for pno, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if len(text) < 100:
                continue
            for chunk in splitter.split_text(text):
                rows.append((name, pno, chunk))

        if not rows:
            print("    no extractable text (scanned PDF?) — skipping")
            continue

        print(f"    {len(rows)} chunks, ~{len(rows) * PAUSE // BATCH // 60 + 1} min")

        for i in range(0, len(rows), BATCH):
            batch = rows[i : i + BATCH]
            vectors = embed([r[2] for r in batch])
            for (src, pg, content), vec in zip(batch, vectors):
                cur.execute(
                    "INSERT INTO documents (source, page, content, embedding) VALUES (%s,%s,%s,%s)",
                    (src, pg, content, vec),
                )
            conn.commit()
            print(f"    {min(i + BATCH, len(rows))}/{len(rows)}")
            if i + BATCH < len(rows):
                time.sleep(PAUSE)

        print(f"    done: {name}")

    cur.execute("SELECT COUNT(*) FROM documents")
    print(f"\nTotal chunks in index: {cur.fetchone()[0]}")
    conn.close()


if __name__ == "__main__":
    main()
