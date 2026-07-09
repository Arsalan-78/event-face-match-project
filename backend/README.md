# Event Photo Face-Matching — Backend

FastAPI backend that detects faces in event photos, embeds them, and lets
attendees find every photo they appear in by uploading a selfie.

## Stack
- **FastAPI** — API framework
- **face_recognition (dlib)** — face detection + 128-d embeddings
- **FAISS** — fast similarity search over embeddings
- **Local disk storage** (swap-in ready for Cloudflare R2 — see `app/storage.py`)

## Setup

> ⚠️ `dlib` needs cmake + a C++ compiler to build. On Ubuntu/Debian:
> ```bash
> sudo apt-get update
> sudo apt-get install -y cmake build-essential
> ```
> On Windows, easiest path is installing via `conda` or using WSL.

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs (auto-generated, try it live): http://localhost:8000/docs

## How it works

1. **Upload event photos**
   `POST /events/{event_id}/photos` — send one or more image files (multipart form,
   field name `files`). Every face in every photo gets detected and embedded,
   and stored in that event's FAISS index (`faiss_store/{event_id}.index`).

2. **Match a selfie**
   `POST /events/{event_id}/match` — send one selfie (field name `selfie`).
   Returns every photo whose face embedding is close enough to the selfie's.

3. **Fetch a photo**
   `GET /events/{event_id}/photos/{filename}` — serves the actual image file.

## Quick test with curl

```bash
# Upload event photos
curl -X POST "http://localhost:8000/events/wedding123/photos" \
  -H "X-API-Key: <ORGANIZER_API_KEY>" \
  -F "files=@photo1.jpg" -F "files=@photo2.jpg"

# Match a selfie
curl -X POST "http://localhost:8000/events/wedding123/match" \
  -F "selfie=@my_selfie.jpg"
```

## Notes on accuracy / production

- Distance `threshold` in `faiss_index.py` (default `0.55`) controls strictness.
  Lower = fewer false positives but might miss real matches. Tune based on testing.
- `model="hog"` in `face_engine.py` is CPU-friendly but less accurate on
  angled/small faces. Switch to `model="cnn"` if you have GPU access.
- For 10k+ photos per event, swap `IndexFlatL2` in `faiss_index.py` for an
  approximate index like `IndexIVFFlat` — much faster at scale.
- Swap local disk storage for Cloudflare R2 by uncommenting the example at
  the bottom of `app/storage.py` (R2 is S3-compatible, so `boto3` works as-is).
