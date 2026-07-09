import os

import faiss
import numpy as np

from app.db import session_scope
from app.faiss_index import EventFaceIndex
from app.repositories import add_faces_for_photo, create_photo, get_or_create_event


def test_add_and_search_faces(isolated_env, monkeypatch):
    monkeypatch.setattr("app.faiss_index.INDEX_DIR", str(isolated_env["faiss_path"]))

    with session_scope() as session:
        event = get_or_create_event(session, "demo123")
        photo = create_photo(
            session,
            event_db_id=event.id,
            filename="p1.jpg",
            storage_key="events/demo123/p1.jpg",
            thumbnail_key="events/demo123/thumbs/p1.jpg",
            width=800,
            height=600,
        )
        photo_id = photo.id

    index = EventFaceIndex("demo123")
    face_data = [
        (np.zeros(128, dtype=np.float32), (10, 20, 30, 40)),
        (np.ones(128, dtype=np.float32) * 0.1, (11, 21, 31, 41)),
    ]
    index.add_faces(face_data, photo_id)

    assert index.face_count == 2
    matches = index.search(np.zeros(128, dtype=np.float32), top_k=5, threshold=0.6)
    assert matches
    assert matches[0]["photo"] == "p1.jpg"


def test_search_uses_euclidean_threshold_not_squared_l2(isolated_env, monkeypatch):
    monkeypatch.setattr("app.faiss_index.INDEX_DIR", str(isolated_env["faiss_path"]))

    with session_scope() as session:
        event = get_or_create_event(session, "threshold123")
        photo = create_photo(
            session,
            event_db_id=event.id,
            filename="p1.jpg",
            storage_key="events/threshold123/p1.jpg",
            thumbnail_key="events/threshold123/thumbs/p1.jpg",
            width=800,
            height=600,
        )
        photo_id = photo.id

    index = EventFaceIndex("threshold123")
    # Euclidean norm ~= 0.6788, but squared L2 ~= 0.4608.
    # Old buggy behavior accepted this at threshold=0.55; correct behavior rejects it.
    far_embedding = np.ones(128, dtype=np.float32) * 0.06
    index.add_faces([(far_embedding, (1, 2, 3, 4))], photo_id)

    matches = index.search(np.zeros(128, dtype=np.float32), top_k=5, threshold=0.55)
    assert matches == []


def test_recovers_pending_index_promotion_after_db_commit(isolated_env, monkeypatch):
    monkeypatch.setattr("app.faiss_index.INDEX_DIR", str(isolated_env["faiss_path"]))

    with session_scope() as session:
        event = get_or_create_event(session, "recover123")
        photo = create_photo(
            session,
            event_db_id=event.id,
            filename="p1.jpg",
            storage_key="events/recover123/p1.jpg",
            thumbnail_key="events/recover123/thumbs/p1.jpg",
            width=800,
            height=600,
        )
        photo_id = photo.id

        add_faces_for_photo(
            session,
            event_db_id=event.id,
            photo_id=photo_id,
            start_faiss_position=0,
            bboxes=[(1, 2, 3, 4)],
        )

    index = EventFaceIndex("recover123")
    index.index.add(np.array([np.zeros(128, dtype=np.float32)]).astype("float32"))
    faiss.write_index(index.index, index._tmp_index_path)
    index._write_pending_operation(
        photo_id=photo_id,
        start_pos=0,
        face_count=1,
        expected_db_count=1,
    )

    recovered = EventFaceIndex("recover123")
    assert recovered.face_count == 1
    assert os.path.exists(recovered.index_path)
    assert not os.path.exists(recovered._pending_path)


def test_discards_stale_pending_index_when_db_never_committed(isolated_env, monkeypatch):
    monkeypatch.setattr("app.faiss_index.INDEX_DIR", str(isolated_env["faiss_path"]))

    index = EventFaceIndex("stale123")
    index.index.add(np.array([np.zeros(128, dtype=np.float32)]).astype("float32"))
    faiss.write_index(index.index, index._tmp_index_path)
    index._write_pending_operation(
        photo_id=999,
        start_pos=0,
        face_count=1,
        expected_db_count=1,
    )

    recovered = EventFaceIndex("stale123")
    assert recovered.face_count == 0
    assert not os.path.exists(recovered._pending_path)
    assert not os.path.exists(recovered._tmp_index_path)

