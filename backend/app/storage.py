"""
storage.py
------------
Storage abstraction for event photos and thumbnails.

- Local backend: writes to disk for development.
- R2 backend: stores private objects in Cloudflare R2 and generates
  signed URLs at read time.
- Cloudinary backend: stores images in Cloudinary and uses Cloudinary URLs.
"""

from io import BytesIO
import os
import uuid

import boto3
import cloudinary
import cloudinary.uploader
from PIL import Image, ImageOps

from app.config import (
    R2_ACCESS_KEY_ID,
    R2_BUCKET,
    R2_ENDPOINT_URL,
    R2_SECRET_ACCESS_KEY,
    SIGNED_URL_TTL_SECONDS,
    STORAGE_BACKEND,
    THUMBNAIL_SIZE,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
)
from app.validators import (
    assert_path_within_base,
    validate_event_id,
    validate_filename,
)

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
EVENTS_DIR = os.path.join(BASE_DIR, "events")
THUMBS_SUBDIR = "thumbs"

os.makedirs(EVENTS_DIR, exist_ok=True)

# Configure Cloudinary if credentials are provided
if STORAGE_BACKEND == "cloudinary":
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )


def _safe_extension(original_filename: str | None) -> str:
    ext = os.path.splitext(original_filename or "")[1].lower()
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ext
    return ".jpg"


def _make_thumbnail(file_bytes: bytes) -> tuple[bytes, int, int]:
    with Image.open(BytesIO(file_bytes)) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        width, height = img.size
        img.thumbnail((THUMBNAIL_SIZE, THUMBNAIL_SIZE))
        output = BytesIO()
        img.save(output, format="JPEG", quality=85, optimize=True)
        return output.getvalue(), width, height


def _event_photo_key(event_id: str, filename: str) -> str:
    return f"events/{event_id}/{filename}"


def _event_thumbnail_key(event_id: str, filename: str) -> str:
    return f"events/{event_id}/{THUMBS_SUBDIR}/{filename}"


def _content_type_from_extension(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "application/octet-stream")


def _build_r2_client():
    if not all([R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET]):
        raise ValueError(
            "R2 storage backend selected but one or more R2 env vars are missing."
        )
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )


def save_event_photo(event_id: str, file_bytes: bytes, original_filename: str) -> dict:
    """
    Save original image + generated thumbnail and return storage metadata.
    """
    validate_event_id(event_id)
    ext = _safe_extension(original_filename)
    filename = f"{uuid.uuid4().hex}{ext}"
    thumb_bytes, width, height = _make_thumbnail(file_bytes)
    photo_key = _event_photo_key(event_id, filename)
    thumb_key = _event_thumbnail_key(event_id, filename)

    if STORAGE_BACKEND == "r2":
        r2 = _build_r2_client()
        r2.put_object(
            Bucket=R2_BUCKET,
            Key=photo_key,
            Body=file_bytes,
            ContentType=_content_type_from_extension(filename),
        )
        r2.put_object(Bucket=R2_BUCKET, Key=thumb_key, Body=thumb_bytes, ContentType="image/jpeg")
        return {
            "filename": filename,
            "storage_key": photo_key,
            "thumbnail_key": thumb_key,
            "width": width,
            "height": height,
        }
    elif STORAGE_BACKEND == "cloudinary":
        # Upload original image to Cloudinary
        original_upload = cloudinary.uploader.upload(
            file_bytes,
            public_id=photo_key,
            resource_type="image",
        )
        # Upload thumbnail to Cloudinary
        thumbnail_upload = cloudinary.uploader.upload(
            thumb_bytes,
            public_id=thumb_key,
            resource_type="image",
        )
        return {
            "filename": filename,
            "storage_key": original_upload["secure_url"],
            "thumbnail_key": thumbnail_upload["secure_url"],
            "width": width,
            "height": height,
        }
    else:
        # Local storage
        event_folder = os.path.join(EVENTS_DIR, event_id)
        thumb_folder = os.path.join(event_folder, THUMBS_SUBDIR)
        os.makedirs(event_folder, exist_ok=True)
        os.makedirs(thumb_folder, exist_ok=True)
        assert_path_within_base(EVENTS_DIR, event_folder)
        assert_path_within_base(EVENTS_DIR, thumb_folder)

        photo_path = os.path.join(event_folder, filename)
        thumb_path = os.path.join(thumb_folder, filename)
        assert_path_within_base(EVENTS_DIR, photo_path)
        assert_path_within_base(EVENTS_DIR, thumb_path)

        with open(photo_path, "wb") as f:
            f.write(file_bytes)
        with open(thumb_path, "wb") as f:
            f.write(thumb_bytes)

        return {
            "filename": filename,
            "storage_key": photo_key,
            "thumbnail_key": thumb_key,
            "width": width,
            "height": height,
        }


def event_photo_path(event_id: str, filename: str, *, thumbnail: bool = False) -> str:
    """
    Local-only path resolver used by FileResponse endpoints.
    """
    validate_event_id(event_id)
    validate_filename(filename)
    if thumbnail:
        path = os.path.join(EVENTS_DIR, event_id, THUMBS_SUBDIR, filename)
    else:
        path = os.path.join(EVENTS_DIR, event_id, filename)
    assert_path_within_base(EVENTS_DIR, path)
    return path


def get_signed_download_url(storage_key: str) -> str:
    if STORAGE_BACKEND != "r2":
        raise ValueError("Signed URLs are only available for the R2 storage backend.")
    r2 = _build_r2_client()
    return r2.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET, "Key": storage_key},
        ExpiresIn=SIGNED_URL_TTL_SECONDS,
    )
