"use client";

import { useEffect, useMemo, useState } from "react";

/* ── Inline SVG Icons ── */
function IconSearch({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconCamera({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function IconZoomIn({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}

function IconDownload({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconLoader({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function IconAlertTriangle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconCheckCircle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function IconImages({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="8" width="16" height="14" rx="2"/>
      <path d="M6 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/>
      <circle cx="10" cy="13" r="2"/>
      <polyline points="18 22 13 17 8 22"/>
    </svg>
  );
}

function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

function IconArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

/* ── Confidence helpers ── */
function confidencePercent(distance) {
  if (typeof distance !== "number") return null;
  return Math.max(0, Math.min(100, Math.round((1 - distance / 0.8) * 100)));
}

function confidenceClass(pct) {
  if (pct === null) return "";
  if (pct >= 75) return "confidence-high";
  if (pct >= 45) return "confidence-med";
  return "confidence-low";
}

/* ── Selfie dropzone ── */
function SelfieDropzone({ selfiePreview, selfieName, onChange }) {
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onChange(file);
  }

  return (
    <label
      htmlFor="selfie-input"
      className={`dropzone${drag ? " dropzone-active" : ""}`}
      style={{ cursor: "pointer", minHeight: 200, position: "relative" }}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
      onDrop={handleDrop}
    >
      {selfiePreview ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            width: "100%",
          }}
        >
          <img
            src={selfiePreview}
            alt="Your selfie preview"
            style={{
              width: 100,
              height: 100,
              objectFit: "cover",
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              boxShadow: "0 0 0 4px var(--accent-ring)",
            }}
          />
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
              {selfieName}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 2 }}>
              Click to change
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="dropzone-icon" aria-hidden="true">
            <IconCamera size={22} />
          </div>
          <div>
            <div className="dropzone-title">Drop your selfie here</div>
            <div className="dropzone-sub">or click to browse — one face only</div>
          </div>
        </>
      )}
      <input
        id="selfie-input"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) onChange(file);
        }}
        aria-label="Upload your selfie photo"
      />
    </label>
  );
}

/* ── Lightbox ── */
function Lightbox({ photos, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, onClose]);

  const pct = confidencePercent(photo.distance);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing photo ${idx + 1} of ${photos.length}: ${photo.filename}`}
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(1000px, 96vw)" }}
      >
        <img src={photo.fullSrc} alt={photo.filename} />
        <div className="modal-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
            {/* Nav arrows */}
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                disabled={idx === 0}
                aria-label="Previous photo"
              >
                <IconArrowLeft size={15} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIdx((i) => Math.min(i + 1, photos.length - 1))}
                disabled={idx === photos.length - 1}
                aria-label="Next photo"
              >
                <IconArrowRight size={15} />
              </button>
            </div>
            <span className="modal-filename">{photo.filename}</span>
            {pct !== null && (
              <span className={`confidence-pill ${confidenceClass(pct)}`}>
                {pct}% match
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
            <a className="btn btn-secondary btn-sm" href={photo.fullSrc} download={photo.filename}>
              <IconDownload size={13} />
              Download
            </a>
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close lightbox">
              <IconX size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MatchPage() {
  const [eventId, setEventId] = useState("");
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  function handleSelfieChange(file) {
    setSelfie(file);
    setSelfiePreview(file ? URL.createObjectURL(file) : "");
  }

  function toMessage(err) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("no face detected")) return "No face detected. Use a clearer, front-facing selfie.";
    if (msg.includes("multiple faces detected")) return "Multiple faces detected. Upload a selfie with only your face.";
    if (msg.includes("networkerror") || msg.includes("failed to fetch"))
      return "Network error. Make sure backend is running and reachable.";
    if (msg.includes("no photos have been indexed"))
      return "This event has no indexed photos yet. Ask the organizer to upload photos first.";
    return err?.message || "Matching failed. Please try again.";
  }

  const resultCountLabel = useMemo(() => {
    if (!photos.length) return "";
    return `${photos.length} match${photos.length === 1 ? "" : "es"} found`;
  }, [photos.length]);

  function getPhotoSrcs(p) {
    const isCloudinaryUrl = (p.thumbnail_url || p.url).startsWith("http");
    const thumbSrc = isCloudinaryUrl
      ? p.thumbnail_url || p.url
      : `/api/photos/${(p.thumbnail_url || p.url).startsWith("/") ? (p.thumbnail_url || p.url).slice(1) : p.thumbnail_url || p.url}`;
    const fullSrc = isCloudinaryUrl
      ? p.url
      : `/api/photos/${p.url.startsWith("/") ? p.url.slice(1) : p.url}`;
    return { thumbSrc, fullSrc };
  }

  // Build enriched photos array for lightbox
  const enrichedPhotos = useMemo(
    () =>
      photos.map((p) => {
        const { fullSrc } = getPhotoSrcs(p);
        return { ...p, fullSrc };
      }),
    [photos]
  );

  async function handleMatch(e) {
    e.preventDefault();
    if (!selfie) return;

    setLoading(true);
    setStatus("Finding your photos…");
    setError("");
    setPhotos([]);
    setLightboxIndex(null);

    const formData = new FormData();
    formData.append("selfie", selfie);

    try {
      const res = await fetch(`/api/events/${eventId}/match`, {
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
              : "Matching failed";
        throw new Error(message);
      }

      setPhotos(data.photos);
      setStatus(
        data.matches_found > 0
          ? `Found you in ${data.matches_found} photo${data.matches_found === 1 ? "" : "s"}.`
          : "No matches found. Try another selfie with better lighting and angle."
      );
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      {/* ── Page header ── */}
      <section className="hero">
        <h1 className="title" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.25rem)" }}>
          Find Your Photos
        </h1>
        <p className="subtitle">
          Upload one selfie and let the AI scan your event gallery. Results appear in seconds.
        </p>
      </section>

      {/* ── Form + Tips ── */}
      <div className="grid grid-2" style={{ gap: "var(--space-4)", alignItems: "start" }}>
        {/* Left — form */}
        <article
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Match Request
            </h2>
          </div>

          <div style={{ padding: "var(--space-5)" }}>
            <form onSubmit={handleMatch} style={{ display: "grid", gap: "var(--space-4)" }}>
              {/* Event ID */}
              <div className="field">
                <label htmlFor="attendee-event-id" className="label">Event ID</label>
                <input
                  id="attendee-event-id"
                  className="input input-mono"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="e.g. summer-gala-2025"
                  aria-describedby="attendee-event-id-hint"
                  autoComplete="off"
                  spellCheck="false"
                />
                <span id="attendee-event-id-hint" className="input-hint">
                  Ask your event organizer for this ID.
                </span>
              </div>

              {/* Selfie */}
              <div className="field">
                <span className="label" id="selfie-label">Your Selfie</span>
                <SelfieDropzone
                  selfiePreview={selfiePreview}
                  selfieName={selfie?.name}
                  onChange={handleSelfieChange}
                  aria-labelledby="selfie-label"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !selfie || !eventId.trim()}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <IconLoader size={15} />
                    Scanning…
                  </>
                ) : (
                  <>
                    <IconSearch size={15} />
                    Find My Photos
                  </>
                )}
              </button>
            </form>

            {/* Status / error messages */}
            {status && !error && !loading && (
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

            {/* Loading indicator */}
            {loading && (
              <div className="status-line status-muted" aria-live="polite" style={{ marginTop: "var(--space-3)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                    AI is scanning event faces…
                  </div>
                  <div className="scanner"><span /></div>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Right — tips */}
        <article
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Tips for Best Results
            </h2>
          </div>
          <div style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {[
                {
                  icon: "🌟",
                  tip: "Good lighting",
                  desc: "Use a well-lit selfie — avoid shadows across your face.",
                },
                {
                  icon: "👤",
                  tip: "Solo shot",
                  desc: "Make sure only your face appears in the selfie for best precision.",
                },
                {
                  icon: "📷",
                  tip: "Front-facing",
                  desc: "Look directly at the camera. Angles reduce match accuracy.",
                },
                {
                  icon: "🔄",
                  tip: "Try again",
                  desc: "If no results appear, upload a different selfie or different lighting.",
                },
              ].map(({ icon, tip, desc }) => (
                <div
                  key={tip}
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {tip}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* ── Results ── */}
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
            Matched Results
          </h2>
          {resultCountLabel && (
            <span className="badge badge-success badge-dot">{resultCountLabel}</span>
          )}
        </div>

        <div style={{ padding: "var(--space-5)" }}>
          {/* Empty state */}
          {!loading && photos.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                <IconImages size={26} />
              </div>
              <p className="empty-state-title">No results yet</p>
              <p className="empty-state-sub">
                Enter your Event ID and upload a selfie to find every photo you appear in.
              </p>
            </div>
          )}

          {/* Skeleton loading */}
          {loading && (
            <div className="skeleton-grid" aria-label="Loading results">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" aria-hidden="true">
                  <div className="skeleton-thumb" />
                  <div style={{ padding: "10px 12px", display: "grid", gap: 8 }}>
                    <div className="skeleton-line" style={{ width: "60%" }} />
                    <div className="skeleton-line" style={{ width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!loading && photos.length > 0 && (
            <div className="results-grid">
              {photos.map((p, i) => {
                const { thumbSrc } = getPhotoSrcs(p);
                const pct = confidencePercent(p.distance);
                return (
                  <article className="result-card" key={p.filename}>
                    <div className="result-thumb-wrapper">
                      <img
                        className="result-thumb"
                        src={thumbSrc}
                        alt={`Matched event photo ${p.filename}`}
                        loading="lazy"
                      />
                      {pct !== null && (
                        <div className="result-confidence-overlay">
                          <span className={`confidence-pill ${confidenceClass(pct)}`}>
                            {pct}% match
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="result-card-body">
                      <div className="result-filename" title={p.filename}>
                        {p.filename}
                      </div>
                      <div className="result-actions">
                        <button
                          className="result-card-btn"
                          type="button"
                          onClick={() => setLightboxIndex(i)}
                          aria-label={`Preview ${p.filename}`}
                        >
                          <IconZoomIn size={13} />
                          Preview
                        </button>
                        <a
                          className="result-card-btn"
                          href={enrichedPhotos[i]?.fullSrc}
                          download={p.filename}
                          aria-label={`Download ${p.filename}`}
                        >
                          <IconDownload size={13} />
                          Download
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={enrichedPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
