"""
Delete one event completely from local dev storage.

Deletes:
- DB rows from events/photos/faces (SQLite only)
- uploads/events/<event_id> folder
- FAISS index files for that event

Usage:
    python clear_event.py groupphoto
    python clear_event.py groupphoto --yes
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def parse_database_url() -> str:
    # Prefer explicit environment variable.
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url

    # Fallback to backend/.env for local development convenience.
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            if key.strip() == "DATABASE_URL":
                return value.strip()

    return "sqlite:///app.db"


def sqlite_path_from_url(database_url: str) -> Path:
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        raise ValueError(
            "This cleanup script currently supports SQLite only. "
            f"Got DATABASE_URL={database_url!r}"
        )
    rel = database_url[len(prefix) :]
    return (ROOT / rel).resolve()


def delete_db_rows(event_id: str, sqlite_path: Path) -> tuple[int, int, int]:
    if not sqlite_path.exists():
        print(f"[warn] SQLite DB not found at: {sqlite_path}")
        return (0, 0, 0)

    conn = sqlite3.connect(str(sqlite_path))
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM events WHERE event_id = ?", (event_id,))
        row = cur.fetchone()
        if not row:
            return (0, 0, 0)

        event_db_id = row[0]

        cur.execute("DELETE FROM faces WHERE event_db_id = ?", (event_db_id,))
        deleted_faces = cur.rowcount if cur.rowcount != -1 else 0

        cur.execute("DELETE FROM photos WHERE event_db_id = ?", (event_db_id,))
        deleted_photos = cur.rowcount if cur.rowcount != -1 else 0

        cur.execute("DELETE FROM events WHERE id = ?", (event_db_id,))
        deleted_events = cur.rowcount if cur.rowcount != -1 else 0

        conn.commit()
        return (deleted_events, deleted_photos, deleted_faces)
    finally:
        conn.close()


def safe_remove(path: Path) -> bool:
    if not path.exists():
        return False
    if path.is_dir():
        for child in sorted(path.rglob("*"), reverse=True):
            if child.is_file() or child.is_symlink():
                child.unlink(missing_ok=True)
            elif child.is_dir():
                child.rmdir()
        path.rmdir()
    else:
        path.unlink(missing_ok=True)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete one event completely from local dev data.")
    parser.add_argument("event_id", help="Event ID to delete, e.g. groupphoto")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    event_id = args.event_id.strip()
    if not event_id:
        print("[error] event_id cannot be empty.")
        return 1

    if not args.yes:
        confirm = input(f"Delete event '{event_id}' from DB, uploads, and FAISS? (y/N): ").strip()
        if confirm.lower() != "y":
            print("Cancelled.")
            return 0

    database_url = parse_database_url()
    try:
        sqlite_path = sqlite_path_from_url(database_url)
    except ValueError as exc:
        print(f"[error] {exc}")
        return 1

    deleted_events, deleted_photos, deleted_faces = delete_db_rows(event_id, sqlite_path)

    uploads_event_dir = ROOT / "uploads" / "events" / event_id
    uploads_deleted = safe_remove(uploads_event_dir)

    faiss_dir = ROOT / "faiss_store"
    faiss_targets = [
        faiss_dir / f"{event_id}.index",
        faiss_dir / f"{event_id}.lock",
        faiss_dir / f"{event_id}.index.tmp",
        faiss_dir / f"{event_id}.index.pending.json",
    ]
    deleted_faiss = sum(1 for p in faiss_targets if safe_remove(p))

    print("Done.")
    print(f"- DB rows deleted: events={deleted_events}, photos={deleted_photos}, faces={deleted_faces}")
    print(f"- Upload folder deleted: {'yes' if uploads_deleted else 'no (not found)'}")
    print(f"- FAISS files deleted: {deleted_faiss}/{len(faiss_targets)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
