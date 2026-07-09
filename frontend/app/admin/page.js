"use client";

import { useMemo, useRef, useState } from "react";

export default function AdminPage() {
  const [eventId, setEventId] = useState("");
  const [queue, setQueue] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const stats = useMemo(() => {
    const uploadedCount = uploadedPhotos.length;
    const indexedFaces = uploadedPhotos.reduce((sum, item) => sum + item.facesFound, 0);
    const failedCount = queue.filter((item) => item.state === "failed").length;
    return { uploadedCount, indexedFaces, failedCount };
  }, [uploadedPhotos, queue]);

  function toMessage(err) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("networkerror") || msg.includes("failed to fetch")) {
      return "Network error. Make sure backend is running and reachable.";
    }
    if (msg.includes("invalid or missing api key")) {
      return "Unauthorized upload. Check frontend/.env.local and backend/.env API keys match.";
    }
    return err?.message || "Upload failed. Please try again.";
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function addFiles(files) {
    if (!files?.length) return;
    const normalized = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      state: "queued",
      facesFound: 0,
      uploadedName: "",
      error: "",
    }));
    setQueue((prev) => [...prev, ...normalized]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    addFiles(Array.from(event.dataTransfer.files || []));
  }

  async function uploadOne(item) {
    const progressTimer = setInterval(() => {
      setQueue((prev) =>
        prev.map((entry) => {
          if (entry.id !== item.id || entry.state !== "uploading") return entry;
          const next = Math.min(entry.progress + 12, 88);
          return { ...entry, progress: next };
        })
      );
    }, 140);

    try {
      const formData = new FormData();
      formData.append("files", item.file);

      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail;
        const message =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg || d).join(", ")
              : "Upload failed";
        throw new Error(message);
      }

      const uploaded = data.uploaded?.[0];
      const facesFound = uploaded?.faces_found ?? 0;
      const savedAs = uploaded?.saved_as ?? "";
      setQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, progress: 100, state: "done", facesFound, uploadedName: savedAs }
            : entry
        )
      );
      setUploadedPhotos((prev) => [
        {
          id: item.id,
          filename: savedAs,
          facesFound,
          previewUrl: item.previewUrl,
        },
        ...prev,
      ]);
    } catch (err) {
      setQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, state: "failed", error: toMessage(err), progress: 0 }
            : entry
        )
      );
      throw err;
    } finally {
      clearInterval(progressTimer);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const queued = queue.filter((item) => item.state === "queued" || item.state === "failed");
    if (!queued.length) return;

    setUploading(true);
    setStatus("Indexing photos...");
    setError("");
    let successCount = 0;
    let failCount = 0;

    for (const item of queued) {
      setQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, state: "uploading", progress: 4, error: "" } : entry
        )
      );
      try {
        await uploadOne(item);
        successCount += 1;
      } catch (_err) {
        failCount += 1;
      }
    }

    setUploading(false);
    if (failCount > 0) {
      setError(`${failCount} file(s) failed. Fix issues and retry.`);
    }
    setStatus(
      `Uploaded ${successCount} photo(s). Indexed faces so far: ${stats.indexedFaces +
        queue
          .filter((x) => queued.some((q) => q.id === x.id) && x.state === "done")
          .reduce((s, x) => s + x.facesFound, 0)}`
    );
  }

  return (
    <main className="page-wrap">
      <section className="hero">
        <h1 className="title">Organizer Upload Console</h1>
        <p className="subtitle">
          Drop event photos, watch indexing progress, and monitor detected-face volume in real time.
        </p>
      </section>

      <section className="grid grid-3" aria-label="Upload stats">
        <article className="card"><div className="card-body"><div className="tiny">Uploaded</div><h2 style={{ margin: "6px 0 0" }}>{stats.uploadedCount}</h2></div></article>
        <article className="card"><div className="card-body"><div className="tiny">Indexed Faces</div><h2 style={{ margin: "6px 0 0" }}>{stats.indexedFaces}</h2></div></article>
        <article className="card"><div className="card-body"><div className="tiny">Failed</div><h2 style={{ margin: "6px 0 0" }}>{stats.failedCount}</h2></div></article>
      </section>

      <section className="grid grid-2" style={{ marginTop: 16 }}>
        <article className="card">
          <div className="card-body">
            <form onSubmit={handleUpload} className="grid">
              <div className="field">
                <label htmlFor="event-id" className="label">Event ID</label>
                <input
                  id="event-id"
                  className="input"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  aria-describedby="event-id-hint"
                />
                <span id="event-id-hint" className="tiny">Use the exact Event ID attendees will enter.</span>
              </div>

              <button
                type="button"
                className={`dropzone ${dragActive ? "dropzone-active" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                aria-label="Upload event photos by dragging and dropping files"
              >
                <strong>Drag & drop event photos</strong>
                <div className="tiny" style={{ marginTop: 6 }}>or click to browse</div>
              </button>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
                style={{ display: "none" }}
              />

              <div className="btn-row">
                <button type="submit" disabled={uploading || !queue.length} className="btn btn-primary">
                  {uploading ? "Indexing..." : "Upload & Index"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                    setQueue([]);
                    setUploadedPhotos([]);
                    setStatus("");
                    setError("");
                  }}
                >
                  Clear Queue
                </button>
              </div>
            </form>

            {status && <p className="status-line status-success" role="status">{status}</p>}
            {error && <p className="status-line status-error" role="alert">{error}</p>}
          </div>
        </article>

        <article className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0 }}>Upload Queue</h3>
            <div className="upload-list">
              {queue.length === 0 && (
                <div className="empty-state">No files queued yet.</div>
              )}
              {queue.map((item) => (
                <div className="upload-item" key={item.id}>
                  <div className="upload-top">
                    <div>
                      <div>{item.file.name}</div>
                      <div className="tiny">{formatBytes(item.file.size)}</div>
                    </div>
                    <div className="tiny">
                      {item.state === "done"
                        ? `Done • ${item.facesFound} faces`
                        : item.state === "failed"
                          ? "Failed"
                          : item.state}
                    </div>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  {item.error && <div className="tiny" style={{ color: "#fca5a5", marginTop: 6 }}>{item.error}</div>}
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-body">
          <h3 style={{ marginTop: 0 }}>Latest Uploaded Thumbnails</h3>
          <div className="preview-grid">
            {uploadedPhotos.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                Uploaded photos will appear here with indexed face counts.
              </div>
            ) : (
              uploadedPhotos.map((photo) => (
                <article className="preview-card" key={photo.id}>
                  <img src={photo.previewUrl} alt={photo.filename || "Uploaded event photo"} loading="lazy" />
                  <div className="meta">
                    <div className="tiny">{photo.filename || "Pending filename"}</div>
                    <div>Faces indexed: {photo.facesFound}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
