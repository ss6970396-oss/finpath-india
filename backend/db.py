"""Shared Postgres/pgvector access for the API and the ingestion script.

The connection string lives in exactly one place: DATABASE_URL in .env.
The fallback matches the db service in docker-compose.yml.
"""

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector

load_dotenv()

def _libpq_url(url: str) -> str:
    """Strip a SQLAlchemy dialect suffix so libpq can parse the URL.

    .env carries `postgresql+psycopg://...` (SQLAlchemy form); psycopg.connect()
    only understands `postgresql://...` and fails with a confusing
    'missing "=" ...' error otherwise.
    """
    scheme, sep, rest = url.partition("://")
    if sep and "+" in scheme:
        return f"{scheme.split('+', 1)[0]}://{rest}"
    return url


DATABASE_URL = _libpq_url(
    os.getenv("DATABASE_URL", "postgresql://finpath:finpath@localhost:5432/finpath")
)

SCHEMA_PATH = Path(__file__).with_name("schema.sql")

# libpq's default is to wait indefinitely. A chat request must not hang for
# minutes when the database is down — fail fast so /api/chat can refuse.
CONNECT_TIMEOUT = 5


def ensure_schema() -> None:
    """Create the vector extension, the documents table and its indexes.

    Idempotent. Must run before register_vector(), which raises if the vector
    type is not yet present in the database.
    """
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with psycopg.connect(DATABASE_URL, connect_timeout=CONNECT_TIMEOUT) as conn:
        # No parameters, so psycopg uses the simple query protocol and accepts
        # the whole multi-statement file in one round trip.
        conn.execute(sql)
        conn.commit()


def connect() -> psycopg.Connection:
    """Open a connection with the pgvector adapters registered."""
    conn = psycopg.connect(DATABASE_URL, connect_timeout=CONNECT_TIMEOUT)
    register_vector(conn)
    return conn
