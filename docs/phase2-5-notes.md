# Phase 2-5 Design Notes

## Data Layer: SQLite in dev, Postgres in prod

- **SQLite for dev**: zero external dependency, quick local bootstrap, good for single-node iteration.
- **Postgres for prod**: reliable concurrent writes, better locking behavior under multi-worker traffic, richer indexing and backup tooling.
- Current schema:
  - `events(event_id, created_at)`
  - `photos(event_db_id, filename, storage_key, thumbnail_key, width, height, created_at)`
  - `faces(event_db_id, photo_id, faiss_position, bbox_top/right/bottom/left, created_at)`

`faces.faiss_position` is the metadata bridge that maps FAISS search rows to photos.

## FAISS Concurrency

Per-event file locking is in place for read-modify-write consistency. This is sufficient for MVP single-instance deployments.

For higher throughput, move to a queue-based writer:

1. upload request stores photo metadata + enqueues indexing task,
2. single worker per event writes vectors to FAISS,
3. API returns `processing` until indexing is complete.

## Migration path to managed vector DB (Pinecone/Qdrant)

Introduce a `VectorStore` interface with methods:

- `upsert(event_id, vectors, metadata)`
- `query(event_id, query_vector, top_k, threshold)`
- `count(event_id)`

Then:
1. keep `faces` table as source of truth metadata,
2. dual-write FAISS + managed store behind a feature flag,
3. run shadow queries and compare recall/latency,
4. cut read traffic to managed store,
5. deprecate local FAISS files once parity is proven.

## IndexFlatL2 upgrade thresholds (rough)

- **<= 100k faces / event**: `IndexFlatL2` is usually fine on a modest CPU.
- **100k - 500k**: evaluate `IndexHNSWFlat` for lower latency while keeping good recall.
- **500k+**: `IndexIVFFlat` or managed vector DB becomes more compelling.
- **1M+**: brute-force `IndexFlatL2` is typically too slow/costly for interactive UX.

## Model choice: dlib vs DeepFace

- **Keep dlib for now** if your goals are low ops overhead + CPU-only deploys.
- **DeepFace (ArcFace/Facenet) generally improves accuracy**, especially on harder poses/lighting.
- Recommended path: support both behind a model provider abstraction, then A/B on a labeled sample from your events.

## Anti-spoofing/liveness (proposal)

For MVP, add challenge-based liveness:
1. require a short selfie video (2-3 seconds),
2. challenge prompt like "blink twice" or "turn head left",
3. verify motion + facial landmark change across frames.

This is not bank-grade PAD, but it significantly raises the bar against static photo spoofing.

## Deployment recommendation

For small internal usage, prefer Docker Compose:
- `backend` (FastAPI + worker)
- `frontend` (Next.js)
- `postgres` (prod-like metadata behavior)
- optional `redis` (if moving to distributed rate limiting/queue)

Keep one VM/small cloud instance initially. Scale components only after real usage signals.
