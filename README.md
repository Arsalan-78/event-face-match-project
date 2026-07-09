# Event Photo Face-Matching & Sharing Platform

Attendees upload a selfie and instantly get every event photo they appear
in, using face recognition.

## Structure

```
project/
├── backend/     FastAPI + face_recognition + FAISS
└── frontend/    Next.js UI (organizer upload page + attendee match page)
```

## Run it (2 terminals)

**1. Configure environment**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set ORGANIZER_API_KEY to a long random string

# Frontend (server-side proxy uses the same key)
cp frontend/.env.local.example frontend/.env.local
```

Generate a key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

**Terminal 1 — Backend**

Windows PowerShell:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

macOS / Linux:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

1. Go to **"I'm the organizer"** → upload a few event photos (needs at least
   one clear face per photo you want matchable) under an Event ID e.g. `wedding123`.
2. Go to **"I'm an attendee"** → upload a selfie, same Event ID → see your matched photos.

## Clear one event (single command)

If you want to completely remove one event from local dev data (DB + uploads + FAISS):

```powershell
cd backend
python clear_event.py groupphoto --yes
```

Without `--yes`, it will ask for confirmation first.

## How the matching works (short version)

1. Every uploaded event photo is scanned for faces (`face_recognition` / dlib).
2. Each face becomes a 128-number vector ("embedding") — a mathematical
   fingerprint of that face.
3. All embeddings for an event are stored in a FAISS index (super fast
   nearest-neighbor search).
4. When someone uploads a selfie, we embed their face too, then ask FAISS:
   "which stored faces are closest to this one?" Close enough (below a
   distance threshold) = it's the same person = that photo is a match.

## What's next / production checklist

- [x] Add SQL metadata store (`events`, `photos`, `faces`) replacing flat JSON metadata
- [x] Add file-lock-based concurrent FAISS writes + consistency checks
- [x] Add auth (organizer API key on upload endpoint)
- [x] Add rate limiting on `/match` endpoint (face matching is compute-heavy)
- [x] Add thumbnail generation so gallery loads faster
- [x] Add Cloudflare R2 integration with signed URL support
- [ ] Deploy backend somewhere with more CPU/GPU (dlib is CPU-heavy)
- [ ] Consider AWS Rekognition / Azure Face API as managed alternative if
      self-hosting face recognition becomes an ops burden

See `docs/phase2-5-notes.md` for migration and scaling guidance.
