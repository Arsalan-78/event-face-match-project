
"use client";

import { useMemo, useState } from "react";

export default function MatchPage() {
  const [eventId, setEventId] = useState("");
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  function toMessage(err) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("no face detected")) return "No face detected. Use a clearer, front-facing selfie.";
    if (msg.includes("multiple faces detected")) return "Multiple faces detected. Upload a selfie with only your face.";
    if (msg.includes("networkerror") || msg.includes("failed to fetch")) {
      return "Network error. Make sure backend is running and reachable.";
    }
    if (msg.includes("no photos have been indexed")) {
      return "This event has no indexed photos yet. Ask the organizer to upload photos first.";
    }
    return err?.message || "Matching failed. Please try again.";
  }

  const resultCountLabel = useMemo(() => {
    if (!photos.length) return "";
    return `${photos.length} match${photos.length === 1 ? "" : "es"} returned`;
  }, [photos.length]);

  function confidenceLabel(distance) {
    if (typeof distance !== "number") return "Unknown";
    const confidence = Math.max(0, Math.min(100, Math.round((1 - distance / 0.8) * 100)));
    return `${confidence}%`;
  }

  async function handleMatch(e) {
    e.preventDefault();
    if (!selfie) return;

    setLoading(true);
    setStatus("Finding your photos...");
    setError("");
    setPhotos([]);

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
          ? `✅ Found you in ${data.matches_found} photo(s)!`
          : "No matches found. Try another selfie with better lighting and angle."
      );
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap">
      <section className="hero">
        <h1 className="title">Find Your Event Photos</h1>
        <p className="subtitle">
          Upload one selfie and let the AI scan your event gallery. Matching runs in seconds.
        </p>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <div className="card-body">
            <form onSubmit={handleMatch} className="grid">
              <div className="field">
                <label htmlFor="attendee-event-id" className="label">Event ID</label>
                <input
                  id="attendee-event-id"
                  className="input"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  aria-describedby="attendee-event-id-hint"
                />
                <span id="attendee-event-id-hint" className="tiny">Ask your organizer for this ID.</span>
              </div>

              <div className="field">
                <label className="label" htmlFor="selfie-input">Your Selfie</label>
                <input
                  id="selfie-input"
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelfie(file);
                    setSelfiePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
              </div>

              {selfiePreview && (
                <div className="preview-card" style={{ maxWidth: 220 }}>
                  <img src={selfiePreview} alt="Selfie preview before matching" />
                  <div className="meta tiny">{selfie?.name}</div>
                </div>
              )}

              <div className="btn-row">
                <button type="submit" disabled={loading || !selfie} className="btn btn-primary">
                  {loading ? "Scanning..." : "Find My Photos"}
                </button>
              </div>
            </form>

            {status && <p className="status-line status-success" role="status">{status}</p>}
            {error && <p className="status-line status-error" role="alert">{error}</p>}
            {loading && (
              <div className="status-line status-muted" aria-live="polite">
                <div>AI is scanning event faces...</div>
                <div className="scanner" style={{ marginTop: 8 }}><span /></div>
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0 }}>Matching Guidance</h3>
            <ul className="subtitle" style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>Use a front-facing selfie with good lighting.</li>
              <li>Avoid group selfies for best precision.</li>
              <li>If no results appear, try a different selfie angle.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Matched Results</h3>
            {resultCountLabel && <span className="tiny">{resultCountLabel}</span>}
          </div>

          {!loading && photos.length === 0 && (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🧠</div>
              <div>No matches yet. Upload a selfie to begin.</div>
            </div>
          )}

          {loading && (
            <div className="skeleton-grid" style={{ marginTop: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <article key={i} className="skeleton-card" aria-hidden="true">
                  <div className="skeleton-thumb" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" style={{ width: "65%" }} />
                </article>
              ))}
            </div>
          )}

          {!loading && photos.length > 0 && (
            <div className="results-grid" style={{ marginTop: 12 }}>
              {photos.map((p) => {
                const thumbPath = (p.thumbnail_url || p.url).startsWith("/") ? (p.thumbnail_url || p.url).slice(1) : (p.thumbnail_url || p.url);
                const fullPath = p.url.startsWith("/") ? p.url.slice(1) : p.url;
                const thumbSrc = `/api/photos/${thumbPath}`;
                const fullSrc = `/api/photos/${fullPath}`;
                return (
                  <article className="result-card" key={p.filename}>
                    <img
                      className="result-thumb"
                      src={thumbSrc}
                      alt={`Matched event photo ${p.filename}`}
                      loading="lazy"
                    />
                    <div className="result-card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <span className="tiny">{p.filename}</span>
                        <span className="badge">Confidence {confidenceLabel(p.distance)}</span>
                      </div>
                      <div className="result-actions">
                        <button
                          className="result-card-btn"
                          type="button"
                          onClick={() => setSelectedPhoto({ fullSrc, filename: p.filename })}
                        >
                          Enlarge
                        </button>
                        <a className="result-card-btn" href={fullSrc} download={p.filename}>
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

      {selectedPhoto && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${selectedPhoto.filename}`}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.fullSrc} alt={selectedPhoto.filename} />
            <div className="modal-bar">
              <a className="btn btn-secondary" href={selectedPhoto.fullSrc} download={selectedPhoto.filename}>
                Download
              </a>
              <button type="button" className="btn btn-primary" onClick={() => setSelectedPhoto(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
