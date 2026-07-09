"""
main.py
---------
FastAPI app exposing 3 core endpoints:

1. POST /events/{event_id}/photos   -> bulk upload event photos.
   Detects every face in every photo, embeds it, and stores it in that
   event's FAISS index + SQL metadata. Requires organizer API key.

2. POST /events/{event_id}/match    -> attendee uploads a selfie.
   We embed the selfie's face and search the event's FAISS index for
   close matches. Returns the list of matching photo URLs. Rate-limited.

3. GET  /events/{event_id}/photos/{filename} -> serve (or redirect to) a photo.
4. GET  /events/{event_id}/thumbnails/{filename} -> serve thumbnail variant.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""

import logging
import os
import tempfile

from fastapi import Depends, FastAPI, File, HTTPException, Path, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.auth import require_organizer_key
from app.config import (
    ALLOWED_ORIGINS,
    MAX_FILES_PER_REQUEST,
    MAX_UPLOAD_BYTES,
    MATCH_RATE_LIMIT,
    ORGANIZER_API_KEY,
    STORAGE_BACKEND,
)
from app.db import session_scope
from app.face_engine import get_face_embeddings, get_single_embedding
from app.faiss_index import EventFaceIndex, IndexCorruptionError
from app.migrations import ensure_schema
from app.repositories import create_photo, get_or_create_event, photo_by_filename
from app.storage import event_photo_path, get_signed_download_url, save_event_photo
from app.validators import validate_event_id, validate_filename, validate_image_bytes

logger = logging.getLogger(__name__)

app = FastAPI(title="Event Photo Face-Matching API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

if not ORGANIZER_API_KEY:
    logger.warning(
        "ORGANIZER_API_KEY is not set — organizer photo uploads will return 503 until configured."
    )


@app.on_event("startup")
def startup() -> None:
    ensure_schema()


@app.get("/")
def root():
    return {"status": "ok", "message": "Event Photo Face-Matching API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Event Photo Face-Matching API is running"}


async def _read_and_validate_upload(file: UploadFile) -> bytes:
    file_bytes = await file.read()
    validate_image_bytes(file_bytes, MAX_UPLOAD_BYTES, file.content_type)
    return file_bytes


def _extract_faces_from_bytes(file_bytes: bytes, suffix: str) -> list[tuple]:
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix or ".jpg") as tmp:
        tmp.write(file_bytes)
        temp_path = tmp.name
    try:
        return get_face_embeddings(temp_path)
    finally:
        os.remove(temp_path)


@app.post("/events/{event_id}/photos")
async def upload_event_photos(
    request: Request,
    event_id: str = Path(..., description="Unique ID for the event"),
    files: list[UploadFile] = File(...),
    _: None = Depends(require_organizer_key),
):
    """
    Upload one or more event photos. Each photo is scanned for faces;
    every face found gets embedded and added to the event's search index.
    """
    try:
        validate_event_id(event_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum is {MAX_FILES_PER_REQUEST} per request.",
        )

    index = EventFaceIndex(event_id)

    results = []
    for file in files:
        try:
            file_bytes = await _read_and_validate_upload(file)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename or 'upload'}: {exc}",
            ) from exc

        try:
            face_data = _extract_faces_from_bytes(
                file_bytes=file_bytes,
                suffix=os.path.splitext(file.filename or "")[1] or ".jpg",
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename or 'upload'}: {exc}",
            ) from exc

        storage_info = save_event_photo(event_id, file_bytes, file.filename or "")
        with session_scope() as session:
            event = get_or_create_event(session, event_id)
            photo = create_photo(
                session,
                event_db_id=event.id,
                filename=storage_info["filename"],
                storage_key=storage_info["storage_key"],
                thumbnail_key=storage_info["thumbnail_key"],
                width=storage_info["width"],
                height=storage_info["height"],
            )
            photo_id = photo.id

        try:
            index.add_faces(face_data, photo_id)
        except IndexCorruptionError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        results.append(
            {
                "original_filename": file.filename,
                "saved_as": storage_info["filename"],
                "faces_found": len(face_data),
            }
        )

    return {"event_id": event_id, "uploaded": results}


@app.post("/events/{event_id}/match")
@limiter.limit(MATCH_RATE_LIMIT)
async def match_selfie(
    request: Request,
    event_id: str = Path(...),
    selfie: UploadFile = File(...),
):
    """
    Upload a selfie and get back every event photo that contains a
    matching face.
    """
    try:
        validate_event_id(event_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        index = EventFaceIndex(event_id)
    except IndexCorruptionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if index.face_count == 0:
        raise HTTPException(
            status_code=404,
            detail="No photos have been indexed for this event yet.",
        )

    try:
        selfie_bytes = await _read_and_validate_upload(selfie)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    suffix = os.path.splitext(selfie.filename or "")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(selfie_bytes)
        tmp_path = tmp.name

    try:
        embedding = get_single_embedding(tmp_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        os.remove(tmp_path)

    try:
        matches = index.search(embedding)
    except IndexCorruptionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "event_id": event_id,
        "matches_found": len(matches),
        "photos": [
            {
                "filename": m["photo"],
                "distance": m["distance"],
                "url": f"/events/{event_id}/photos/{m['photo']}",
                "thumbnail_url": f"/events/{event_id}/thumbnails/{m['photo']}",
            }
            for m in matches
        ],
    }


@app.get("/events/{event_id}/photos/{filename}")
def get_photo(event_id: str, filename: str):
    try:
        validate_event_id(event_id)
        validate_filename(filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    with session_scope() as session:
        event = get_or_create_event(session, event_id)
        photo = photo_by_filename(session, event_db_id=event.id, filename=filename)

    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    if STORAGE_BACKEND == "r2":
        return RedirectResponse(get_signed_download_url(photo.storage_key))
    elif STORAGE_BACKEND == "cloudinary":
        return RedirectResponse(photo.storage_key)

    path = event_photo_path(event_id, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(path)


@app.get("/events/{event_id}/thumbnails/{filename}")
def get_thumbnail(event_id: str, filename: str):
    try:
        validate_event_id(event_id)
        validate_filename(filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    with session_scope() as session:
        event = get_or_create_event(session, event_id)
        photo = photo_by_filename(session, event_db_id=event.id, filename=filename)

    if photo is None:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    if STORAGE_BACKEND == "r2":
        return RedirectResponse(get_signed_download_url(photo.thumbnail_key))
    elif STORAGE_BACKEND == "cloudinary":
        return RedirectResponse(photo.thumbnail_key)

    path = event_photo_path(event_id, filename, thumbnail=True)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(path)
