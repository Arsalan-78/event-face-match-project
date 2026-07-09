"""
db.py
-----
SQLAlchemy session/engine setup.

SQLite is intentionally the default to keep local setup friction low.
For production, set DATABASE_URL to PostgreSQL (or compatible managed DB).
"""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL

_engine = None
_SessionLocal = None


def _build_engine(url: str):
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_engine(url, future=True, pool_pre_ping=True, connect_args=connect_args)


def configure_database(url: str = DATABASE_URL) -> None:
    global _engine, _SessionLocal
    _engine = _build_engine(url)
    _SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


def get_engine():
    global _engine
    if _engine is None:
        configure_database()
    return _engine


def get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is None:
        configure_database()
    return _SessionLocal


@contextmanager
def session_scope():
    session = get_sessionmaker()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

