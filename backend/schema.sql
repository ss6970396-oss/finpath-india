-- FinPath India — RAG index schema.
--
-- Idempotent: safe to run on every startup and before every ingest.
-- Applied by db.ensure_schema(), which is called from the FastAPI lifespan
-- hook in main.py and from the top of ingest.main().
--
-- NOTE: the embedding dimension (768) must stay in step with
-- EMBED_DIM in main.py and output_dimensionality in ingest.py.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id        bigserial PRIMARY KEY,
    source    text        NOT NULL,
    page      integer     NOT NULL,
    content   text        NOT NULL,
    embedding vector(768) NOT NULL
);

-- Supports ingest.py's "SELECT DISTINCT source" skip-already-indexed check.
CREATE INDEX IF NOT EXISTS documents_source_idx
    ON documents (source);

-- Cosine distance, matching the `<=>` operator used by retrieve() in main.py.
CREATE INDEX IF NOT EXISTS documents_embedding_idx
    ON documents USING hnsw (embedding vector_cosine_ops);
