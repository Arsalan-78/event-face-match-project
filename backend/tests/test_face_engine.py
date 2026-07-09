import numpy as np
from PIL import Image

from app import face_engine


def _fixture_image(path):
    img = Image.new("RGB", (64, 64), color=(120, 120, 120))
    img.save(path, format="JPEG")


def test_get_single_embedding_no_face(monkeypatch, tmp_path):
    image_path = tmp_path / "selfie.jpg"
    _fixture_image(image_path)

    monkeypatch.setattr(face_engine.face_recognition, "load_image_file", lambda _: np.zeros((10, 10, 3)))
    monkeypatch.setattr(face_engine.face_recognition, "face_encodings", lambda *_args, **_kwargs: [])

    try:
        face_engine.get_single_embedding(str(image_path))
        assert False, "Expected ValueError for no-face selfie"
    except ValueError as exc:
        assert "No face detected" in str(exc)


def test_get_single_embedding_multiple_faces(monkeypatch, tmp_path):
    image_path = tmp_path / "group.jpg"
    _fixture_image(image_path)

    monkeypatch.setattr(face_engine.face_recognition, "load_image_file", lambda _: np.zeros((10, 10, 3)))
    monkeypatch.setattr(
        face_engine.face_recognition,
        "face_encodings",
        lambda *_args, **_kwargs: [np.ones(128), np.zeros(128)],
    )

    try:
        face_engine.get_single_embedding(str(image_path))
        assert False, "Expected ValueError for multi-face selfie"
    except ValueError as exc:
        assert "Multiple faces detected" in str(exc)


def test_get_face_embeddings_skips_unencoded_faces(monkeypatch, tmp_path):
    image_path = tmp_path / "event.jpg"
    _fixture_image(image_path)

    monkeypatch.setattr(face_engine.face_recognition, "load_image_file", lambda _: np.zeros((10, 10, 3)))
    monkeypatch.setattr(
        face_engine.face_recognition,
        "face_locations",
        lambda *_args, **_kwargs: [(1, 2, 3, 4), (5, 6, 7, 8)],
    )

    def fake_encodings(_image, known_face_locations):
        if known_face_locations[0] == (1, 2, 3, 4):
            return [np.ones(128)]
        return []

    monkeypatch.setattr(face_engine.face_recognition, "face_encodings", fake_encodings)

    results = face_engine.get_face_embeddings(str(image_path))
    assert len(results) == 1
    assert results[0][1] == (1, 2, 3, 4)

