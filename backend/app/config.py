"""
config.py
---------
Central configuration loaded from environment variables.
Uses python-dotenv so a local .env file works in development.
"""

import os

from dotenv import load_dotenv

load_dotenv()

ORGANIZER_API_KEY: str = os.getenv("ORGANIZER_API_KEY", "")

# Comma-separated list, e.g. "http://localhost:3000,https://photos.example.com"
ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_FILES_PER_REQUEST: int = int(os.getenv("MAX_FILES_PER_REQUEST", "20"))

# slowapi format, e.g. "10/minute"
MATCH_RATE_LIMIT: str = os.getenv("MATCH_RATE_LIMIT", "10/minute")

# Database: SQLite is the default for local/dev; swap to PostgreSQL in prod.
DEFAULT_SQLITE_PATH = os.path.join(os.path.dirname(__file__), "..", "app.db")
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

# Storage: "local" (dev) or "r2" (Cloudflare R2 / S3-compatible) or "cloudinary"
STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local").lower()

# Signed URL settings (used by R2 backend).
SIGNED_URL_TTL_SECONDS: int = int(os.getenv("SIGNED_URL_TTL_SECONDS", "900"))

# Thumbnail edge length in pixels.
THUMBNAIL_SIZE: int = int(os.getenv("THUMBNAIL_SIZE", "512"))

# Cloudflare R2 settings.
R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL", "")
R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET: str = os.getenv("R2_BUCKET", "")

# Cloudinary settings.
CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
