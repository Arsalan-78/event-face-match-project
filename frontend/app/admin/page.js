"use client";

import { useMemo, useRef, useState } from "react";

/* ── Inline SVG icons ── */
function IconUpload({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconImage({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function IconCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconClock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconLoader({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function IconFace({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
    </svg>
  );
}

function IconAlertTriangle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconCheckCircle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function IconTrash({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

/* ── Status chip ── */
function StatusChip({ state, facesFound }) {
  if (state === "done") {
    return (
      <span className="badge badge-success badge-dot">
        {facesFound} {facesFound === 1 ? "face" : "faces"}
      </span>
    );
  }
  if (state === "failed") {
    return <span className="badge badge-danger badge-dot">Failed</span>;
  }
  if (state === "uploading") {
    return <span className="badge badge-accent" style={{ gap: 5 }}><IconLoader size={10} />Uploading</span>;
  }
  return <span className="badge badge-muted badge-dot">Queued</span>;
}

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

  const queuedCount = queue.filter((q) => q.state === "queued").length;
  const canUpload = !uploading && queue.length > 0 && eventId.trim().length > 0;

  return (
    <div className="page-wrap">
      {/* ── Page header ── */}
      <section className="hero">
        <h1 className="title" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.25rem)" }}>
          Organizer Console
        </h1>
        <p className="subtitle">
          Upload your event gallery, monitor indexing progress, and track detected faces in real time.
        </p>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-3" aria-label="Upload statistics" style={{ marginBottom: "var(--space-6)" }}>
        <article className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}
            aria-hidden="true"
          >
            <IconUpload size={18} />
          </div>
          <div className="stat-card-label">Photos Uploaded</div>
          <div className="stat-card-value">{stats.uploadedCount}</div>
          <div className="stat-card-sub">
            {queue.length > 0 ? `${queue.length} in queue` : "No files in queue"}
          </div>
        </article>

        <article className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: "var(--success-dim)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}
            aria-hidden="true"
          >
            <IconFace size={18} />
          </div>
          <div className="stat-card-label">Faces Indexed</div>
          <div className="stat-card-value">{stats.indexedFaces}</div>
          <div className="stat-card-sub">Detected &amp; stored for matching</div>
        </article>

        <article className="stat-card">
          <div
            className="stat-card-icon"
            style={{
              background: stats.failedCount > 0 ? "var(--danger-dim)" : "rgba(255,255,255,0.04)",
              border: stats.failedCount > 0 ? "1px solid rgba(239,68,68,0.25)" : "1px solid var(--border)",
              color: stats.failedCount > 0 ? "#fca5a5" : "var(--text-disabled)",
            }}
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-card-label">Failed</div>
          <div
            className="stat-card-value"
            style={{ color: stats.failedCount > 0 ? "var(--danger-text)" : undefined }}
          >
            {stats.failedCount}
          </div>
          <div className="stat-card-sub">
            {stats.failedCount > 0 ? "Retry failed items below" : "No errors"}
          </div>
        </article>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-2" style={{ gap: "var(--space-4)", alignItems: "start" }}>
        {/* Upload form */}
        <article
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Upload Photos
            </h2>
            {queue.length > 0 && (
              <span className="badge badge-accent">{queue.length} file{queue.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div style={{ padding: "var(--space-5)" }}>
            <form onSubmit={handleUpload} style={{ display: "grid", gap: "var(--space-4)" }}>
              {/* Event ID */}
              <div className="field">
                <label htmlFor="event-id" className="label">Event ID</label>
                <input
                  id="event-id"
                  className="input input-mono"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="e.g. summer-gala-2025"
                  aria-describedby="event-id-hint"
                  autoComplete="off"
                  spellCheck="false"
                />
                <span id="event-id-hint" className="input-hint">
                  Use the exact ID that attendees will enter when searching for their photos.
                </span>
              </div>

              {/* Dropzone */}
              <button
                type="button"
                className={`dropzone${dragActive ? " dropzone-active" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={handleDrop}
                aria-label="Upload event photos by dragging files here or clicking to browse"
              >
                <div className="dropzone-icon" aria-hidden="true">
                  <IconUpload size={22} />
                </div>
                <div>
                  <div className="dropzone-title">
                    {dragActive ? "Release to add files" : "Drag & drop photos here"}
                  </div>
                  <div className="dropzone-sub">
                    or click to browse — JPEG, PNG, WEBP accepted
                  </div>
                </div>
              </button>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
                style={{ display: "none" }}
                aria-hidden="true"
              />

              {/* Action buttons */}
              <div className="btn-row">
                <button
                  type="submit"
                  disabled={!canUpload}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {uploading ? (
                    <>
                      <IconLoader size={15} />
                      Indexing…
                    </>
                  ) : (
                    <>
                      <IconUpload size={15} />
                      Upload &amp; Index
                      {queuedCount > 0 && ` (${queuedCount})`}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={uploading || queue.length === 0}
                  onClick={() => {
                    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                    setQueue([]);
                    setUploadedPhotos([]);
                    setStatus("");
                    setError("");
                  }}
                  aria-label="Clear all queued files"
                >
                  <IconTrash size={14} />
                  Clear
                </button>
              </div>
            </form>

            {/* Status messages */}
            {status && !error && (
              <div className="status-line status-success" role="status" style={{ marginTop: "var(--space-3)" }}>
                <IconCheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {status}
              </div>
            )}
            {error && (
              <div className="status-line status-error" role="alert" style={{ marginTop: "var(--space-3)" }}>
                <IconAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}
          </div>
        </article>

        {/* Upload queue */}
        <article
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Upload Queue
            </h2>
            {stats.failedCount > 0 && (
              <span className="badge badge-danger">{stats.failedCount} failed</span>
            )}
          </div>

          <div style={{ padding: "var(--space-4) var(--space-5)", maxHeight: 440, overflowY: "auto" }}>
            {queue.length === 0 ? (
              <div className="empty-state" style={{ padding: "var(--space-10) var(--space-4)" }}>
                <div className="empty-state-icon" aria-hidden="true">
                  <IconImage size={24} />
                </div>
                <p className="empty-state-title">No files queued</p>
                <p className="empty-state-sub">
                  Drag photos into the dropzone or click to browse your files.
                </p>
              </div>
            ) : (
              <div className="upload-list">
                {queue.map((item) => (
                  <div className="upload-item" key={item.id}>
                    {/* Thumbnail */}
                    {item.previewUrl ? (
                      <img
                        className="upload-item-thumb"
                        src={item.previewUrl}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="upload-item-thumb-placeholder" aria-hidden="true">
                        <IconImage size={18} />
                      </div>
                    )}

                    {/* Info */}
                    <div className="upload-item-info">
                      <div className="upload-item-name" title={item.file.name}>
                        {item.file.name}
                      </div>
                      <div className="upload-item-meta">{formatBytes(item.file.size)}</div>

                      {/* Progress bar */}
                      {(item.state === "uploading" || item.state === "done") && (
                        <div className="progress-bar" aria-hidden="true">
                          <div
                            className={`progress-bar-fill${item.state === "done" ? " complete" : ""}`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error */}
                      {item.error && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--danger-text)",
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.error}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="upload-item-status">
                      <StatusChip state={item.state} facesFound={item.facesFound} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>

      {/* ── Photo thumbnails ── */}
      <section
        style={{
          marginTop: "var(--space-6)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Uploaded Thumbnails
          </h2>
          {uploadedPhotos.length > 0 && (
            <span className="badge badge-muted">{uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div style={{ padding: "var(--space-5)" }}>
          {uploadedPhotos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                <IconImage size={24} />
              </div>
              <p className="empty-state-title">No photos yet</p>
              <p className="empty-state-sub">
                Successfully uploaded photos will appear here with their indexed face counts.
              </p>
            </div>
          ) : (
            <div className="preview-grid">
              {uploadedPhotos.map((photo) => (
                <article className="preview-card" key={photo.id}>
                  <img
                    src={photo.previewUrl}
                    alt={photo.filename || "Uploaded event photo"}
                    loading="lazy"
                  />
                  <div className="preview-face-badge" aria-label={`${photo.facesFound} faces indexed`}>
                    {photo.facesFound} {photo.facesFound === 1 ? "face" : "faces"}
                  </div>
                  <div className="meta">
                    <div
                      className="tiny"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={photo.filename}
                    >
                      {photo.filename || "Pending…"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
