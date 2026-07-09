import os

import pytest

from app.db import configure_database
from app.migrations import ensure_schema


@pytest.fixture
def isolated_env(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    uploads_path = tmp_path / "uploads"
    faiss_path = tmp_path / "faiss_store"
    uploads_path.mkdir(parents=True, exist_ok=True)
    faiss_path.mkdir(parents=True, exist_ok=True)

    monkeypatch.setenv("ORGANIZER_API_KEY", "test-key")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("STORAGE_BACKEND", "local")

    configure_database(f"sqlite:///{db_path.as_posix()}")
    ensure_schema()

    return {"uploads_path": uploads_path, "faiss_path": faiss_path, "db_path": db_path}

