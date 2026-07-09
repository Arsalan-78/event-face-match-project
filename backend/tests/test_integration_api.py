import io

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

import app.auth as auth_module
import app.main as main_module
import app.storage as storage_module


def _image_bytes():
    image = Image.new("RGB", (128, 128), color=(200, 200, 200))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_upload_then_match_flow(isolated_env, monkeypatch):
    monkeypatch.setattr("app.faiss_index.INDEX_DIR", str(isolated_env["faiss_path"]))
    monkeypatch.setattr(storage_module, "EVENTS_DIR", str(isolated_env["uploads_path"] / "events"))

    auth_module.ORGANIZER_API_KEY = "test-key"

    monkeypatch.setattr(
        main_module,
        "get_face_embeddings",
        lambda _path: [(np.zeros(128, dtype=np.float32), (1, 2, 3, 4))],
    )
    monkeypatch.setattr(
        main_module,
        "get_single_embedding",
        lambda _path: np.zeros(128, dtype=np.float32),
    )

    client = TestClient(main_module.app)

    upload = client.post(
        "/events/eventxyz/photos",
        files=[("files", ("event.jpg", _image_bytes(), "image/jpeg"))],
        headers={"X-API-Key": "test-key"},
    )
    assert upload.status_code == 200, upload.text
    payload = upload.json()
    assert payload["uploaded"][0]["faces_found"] == 1

    match = client.post(
        "/events/eventxyz/match",
        files={"selfie": ("selfie.jpg", _image_bytes(), "image/jpeg")},
    )
    assert match.status_code == 200, match.text
    result = match.json()
    assert result["matches_found"] == 1
    assert result["photos"][0]["thumbnail_url"].startswith("/events/eventxyz/thumbnails/")

