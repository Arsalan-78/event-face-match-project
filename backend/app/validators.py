"""
validators.py
-------------
Input validation helpers shared across endpoints and storage.

Why separate from main.py: validation rules are reused in storage path
construction, upload handlers, and (later) the database layer. Keeping them
in one place avoids drift between "what we accept over HTTP" and "what we
write to disk".
"""

import os
import re
from io import BytesIO

from PIL import Image

# Event IDs appear in URLs and filesystem paths — keep them boring and safe.
EVENT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")

# Stored filenames are UUID-based, but we validate on read as defense-in-depth.
FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]{1,128}$")

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def validate_event_id(event_id: str) -> str:
    if not EVENT_ID_PATTERN.match(event_id):
        raise ValueError(
            "Invalid event_id. Use 1–64 characters: letters, numbers, hyphens, underscores."
        )
    return event_id


def validate_filename(filename: str) -> str:
    if not filename or not FILENAME_PATTERN.match(filename):
        raise ValueError("Invalid filename.")
    return filename


def assert_path_within_base(base_dir: str, target_path: str) -> str:
    """
    Ensure target_path resolves inside base_dir.
    Prevents path-traversal attacks via crafted event_id / filename values.
    """
    base = os.path.realpath(base_dir)
    resolved = os.path.realpath(target_path)
    if os.path.commonpath([base, resolved]) != base:
        raise ValueError("Path escapes allowed directory.")
    return resolved


def validate_image_bytes(
    file_bytes: bytes,
    max_bytes: int,
    content_type: str | None = None,
) -> None:
    if not file_bytes:
        raise ValueError("Empty file upload.")

    if len(file_bytes) > max_bytes:
        max_mb = max_bytes // (1024 * 1024)
        raise ValueError(f"File too large. Maximum size is {max_mb} MB.")

    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported file type '{content_type}'. "
            "Upload a JPEG, PNG, WebP, or GIF image."
        )

    try:
        # verify() checks structure without fully decoding pixels.
        with Image.open(BytesIO(file_bytes)) as img:
            img.verify()

        # Must re-open after verify() — PIL docs warn the file handle is exhausted.
        with Image.open(BytesIO(file_bytes)) as img:
            img.load()
            width, height = img.size
            if width < 32 or height < 32:
                raise ValueError("Image is too small to process.")
            if width > 12_000 or height > 12_000:
                raise ValueError("Image dimensions are too large.")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Invalid or corrupted image file.") from exc
