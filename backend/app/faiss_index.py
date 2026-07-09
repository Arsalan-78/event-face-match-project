"""
faiss_index.py
----------------
A thin wrapper around FAISS that stores face embeddings per event and lets
us search "which faces are close to this selfie embedding?" very fast,
even with thousands of photos.

For simplicity this keeps one FAISS index per event, in-memory, and
persists it to disk as a .index file so it survives server restarts.
Metadata now lives in SQL tables (events/photos/faces). The `faces` table
stores `faiss_position` so FAISS row index -> photo lookup is durable.

Concurrency: a per-event file lock wraps every read-modify-write so two
simultaneous uploads cannot clobber each other. Saves are atomic (write
to .tmp then os.replace) so a crash mid-write won't corrupt the index.
We also keep a tiny pending-operation journal so a crash between DB commit
and FAISS promotion can be recovered deterministically on the next access.
"""

import os
import json
import faiss
import numpy as np
from filelock import FileLock
from typing import List, Tuple

from app.db import session_scope
from app.repositories import (
    add_faces_for_photo,
    count_faces_for_event,
    get_or_create_event,
    photos_by_faiss_positions,
)
from app.validators import validate_event_id

INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "faiss_store")
os.makedirs(INDEX_DIR, exist_ok=True)

EMBEDDING_DIM = 128  # face_recognition produces 128-d vectors


class IndexCorruptionError(RuntimeError):
    """Raised when on-disk index and database metadata are out of sync."""


class EventFaceIndex:
    def __init__(self, event_id: str):
        validate_event_id(event_id)
        self.event_id = event_id
        self.index_path = os.path.join(INDEX_DIR, f"{event_id}.index")
        self._lock = FileLock(os.path.join(INDEX_DIR, f"{event_id}.lock"), timeout=60)

        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)

    @property
    def _tmp_index_path(self) -> str:
        return self.index_path + ".tmp"

    @property
    def _pending_path(self) -> str:
        return self.index_path + ".pending.json"

    def _load_from_disk(self) -> None:
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            self.index = faiss.IndexFlatL2(EMBEDDING_DIM)

    def _index_count_for_path(self, path: str) -> int | None:
        if not os.path.exists(path):
            return None
        return faiss.read_index(path).ntotal

    def _write_pending_operation(
        self,
        *,
        photo_id: int,
        start_pos: int,
        face_count: int,
        expected_db_count: int,
    ) -> None:
        pending_payload = {
            "photo_id": photo_id,
            "start_pos": start_pos,
            "face_count": face_count,
            "expected_db_count": expected_db_count,
        }
        with open(self._pending_path, "w", encoding="utf-8") as f:
            json.dump(pending_payload, f)

    def _clear_pending_operation(self) -> None:
        if os.path.exists(self._pending_path):
            os.remove(self._pending_path)
        if os.path.exists(self._tmp_index_path):
            os.remove(self._tmp_index_path)

    def _recover_pending_operation(self, committed_face_count: int) -> None:
        """
        Recover interrupted writes safely.

        Cases:
        1. DB did not commit: keep current index, discard temp + journal.
        2. DB committed but temp not promoted: promote temp index.
        3. DB committed and temp already promoted: drop stale journal.
        """
        if not os.path.exists(self._pending_path):
            return

        with open(self._pending_path, "r", encoding="utf-8") as f:
            pending = json.load(f)

        expected_db_count = int(pending["expected_db_count"])
        current_index_count = self._index_count_for_path(self.index_path) or 0
        temp_index_count = self._index_count_for_path(self._tmp_index_path)

        if committed_face_count == current_index_count:
            # DB never committed this operation; discard stale temp/journal.
            self._clear_pending_operation()
            return

        if committed_face_count != expected_db_count:
            raise IndexCorruptionError(
                f"Interrupted FAISS update for event '{self.event_id}' cannot be recovered "
                f"(db={committed_face_count}, index={current_index_count}, expected={expected_db_count})."
            )

        if current_index_count == expected_db_count:
            # Promotion already happened before the crash; only cleanup remains.
            self._clear_pending_operation()
            return

        if temp_index_count == expected_db_count:
            os.replace(self._tmp_index_path, self.index_path)
            self._clear_pending_operation()
            return

        raise IndexCorruptionError(
            f"Interrupted FAISS update for event '{self.event_id}' is missing a recoverable temp index."
        )

    def _assert_consistent(self, face_count: int) -> None:
        if face_count != self.index.ntotal:
            raise IndexCorruptionError(
                f"FAISS index and DB metadata are out of sync for event '{self.event_id}' "
                f"({self.index.ntotal} vectors vs {face_count} face rows). "
                "Re-index the event photos or delete the corrupted index files."
            )

    def add_faces(
        self,
        face_data: List[Tuple[np.ndarray, tuple[int, int, int, int]]],
        photo_id: int,
    ) -> None:
        """Add every face found in one photo to the index and DB."""
        if not face_data:
            return

        with self._lock:
            with session_scope() as session:
                event = get_or_create_event(session, self.event_id)
                committed_face_count = count_faces_for_event(session, event.id)
                self._recover_pending_operation(committed_face_count)
                self._load_from_disk()
                self._assert_consistent(committed_face_count)

                embeddings = [embedding for embedding, _bbox in face_data]
                bboxes = [bbox for _embedding, bbox in face_data]
                start_pos = self.index.ntotal
                expected_db_count = committed_face_count + len(face_data)

                vectors = np.array(embeddings).astype("float32")
                self.index.add(vectors)
                self._save_temp_index()
                self._write_pending_operation(
                    photo_id=photo_id,
                    start_pos=start_pos,
                    face_count=len(face_data),
                    expected_db_count=expected_db_count,
                )

                add_faces_for_photo(
                    session,
                    event_db_id=event.id,
                    photo_id=photo_id,
                    start_faiss_position=start_pos,
                    bboxes=bboxes,
                )

            # Session committed successfully at this point. Promote the temp
            # index after the DB commit; recovery logic handles crashes here.
            os.replace(self._tmp_index_path, self.index_path)
            self._clear_pending_operation()

    def search(self, query_embedding: np.ndarray, top_k: int = 50, threshold: float = 0.55):
        """
        Returns a deduplicated list of photo filenames whose face distance
        to the query embedding is below `threshold` (lower = better match).
        threshold ~0.5-0.6 works well for face_recognition's 128-d encodings.
        """
        with self._lock:
            with session_scope() as session:
                event = get_or_create_event(session, self.event_id)
                committed_face_count = count_faces_for_event(session, event.id)
                self._recover_pending_operation(committed_face_count)
                self._load_from_disk()
                self._assert_consistent(committed_face_count)

                if self.index.ntotal == 0:
                    return []

                query = np.array([query_embedding]).astype("float32")
                distances, indices = self.index.search(query, min(top_k, self.index.ntotal))

                candidate_positions = [int(idx) for idx in indices[0] if idx != -1]
                photo_lookup = photos_by_faiss_positions(
                    session, event_db_id=event.id, positions=candidate_positions
                )

                matched_photos = []
                seen = set()
                for dist, idx in zip(distances[0], indices[0]):
                    if idx == -1:
                        continue
                    # IndexFlatL2 returns squared Euclidean distance. Convert
                    # back to plain Euclidean so the threshold semantics match
                    # face_recognition / NumPy norms used elsewhere.
                    euclidean_distance = float(np.sqrt(dist))
                    if euclidean_distance <= threshold and int(idx) in photo_lookup:
                        photo = photo_lookup[int(idx)]
                        if photo.filename not in seen:
                            seen.add(photo.filename)
                            matched_photos.append(
                                {"photo": photo.filename, "distance": euclidean_distance}
                            )

                matched_photos.sort(key=lambda x: x["distance"])
                return matched_photos

    @property
    def face_count(self) -> int:
        with self._lock:
            with session_scope() as session:
                event = get_or_create_event(session, self.event_id)
                committed_face_count = count_faces_for_event(session, event.id)
                self._recover_pending_operation(committed_face_count)
                self._load_from_disk()
                self._assert_consistent(committed_face_count)
                return self.index.ntotal

    def _save_temp_index(self) -> None:
        faiss.write_index(self.index, self._tmp_index_path)
