import Link from "next/link";

export default function Home() {
  return (
    <div className="page-wrap">
      {/* ── Hero ── */}
      <section className="hero" style={{ maxWidth: 640, marginBottom: "var(--space-12)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent-dim)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: "var(--radius-full)",
            padding: "4px 12px",
            marginBottom: "var(--space-5)",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#a5b4fc",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#6366f1",
              boxShadow: "0 0 6px #6366f1",
              flexShrink: 0,
              animation: "pulse-soft 2s ease-in-out infinite",
            }}
          />
          AI-Powered Face Matching
        </div>

        <h1 className="title">
          Find every photo<br />
          <span className="title-gradient">you appear in.</span>
        </h1>

        <p className="subtitle" style={{ marginTop: "var(--space-5)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
          Upload your event gallery once. Attendees submit a selfie.
          Our AI finds every matching photo — privately and in seconds.
        </p>

        <div className="btn-row" style={{ marginTop: "var(--space-8)" }}>
          <Link href="/admin" className="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Event Photos
          </Link>
          <Link href="/match" className="btn btn-secondary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Find My Photos
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section aria-label="How it works" style={{ marginBottom: "var(--space-6)" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "var(--space-5)",
          }}
        >
          How it works
        </p>

        <div className="grid grid-3" aria-label="Platform steps">
          {[
            {
              step: "01",
              title: "Upload & Index",
              desc: "Organizers upload the full event gallery. The system detects and indexes every face automatically.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              ),
              color: "rgba(99,102,241,0.12)",
              border: "rgba(99,102,241,0.25)",
              iconColor: "#818cf8",
            },
            {
              step: "02",
              title: "Submit a Selfie",
              desc: "Attendees enter an Event ID and upload one clear selfie. No account required.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ),
              color: "rgba(16,185,129,0.1)",
              border: "rgba(16,185,129,0.22)",
              iconColor: "#34d399",
            },
            {
              step: "03",
              title: "Instant Results",
              desc: "Matched photos appear with confidence scores. Preview and download in one click.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              ),
              color: "rgba(245,158,11,0.1)",
              border: "rgba(245,158,11,0.22)",
              iconColor: "#fbbf24",
            },
          ].map(({ step, title, desc, icon, color, border, iconColor }) => (
            <article
              key={step}
              className="card feature-card"
              style={{ overflow: "hidden" }}
            >
              <div className="card-body">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: color,
                    border: `1px solid ${border}`,
                    display: "grid",
                    placeItems: "center",
                    marginBottom: "var(--space-4)",
                    color: iconColor,
                  }}
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Step {step}
                </div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                    margin: "0 0 var(--space-3)",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                  {desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Choose your role ── */}
      <section
        style={{
          marginTop: "var(--space-8)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-4)",
        }}
        aria-label="Choose your role"
      >
        {[
          {
            href: "/admin",
            label: "I'm an Organizer",
            sub: "Upload your event gallery and get a shareable Event ID for attendees.",
            cta: "Open Upload Console",
            variant: "btn-primary",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="3 9 21 9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            ),
            bg: "var(--accent-dim)",
            iconBorder: "rgba(99,102,241,0.3)",
            iconColor: "#818cf8",
          },
          {
            href: "/match",
            label: "I'm an Attendee",
            sub: "Enter your Event ID, upload one selfie, and find all your photos instantly.",
            cta: "Find My Photos",
            variant: "btn-secondary",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            ),
            bg: "var(--success-dim)",
            iconBorder: "rgba(16,185,129,0.3)",
            iconColor: "#34d399",
          },
        ].map(({ href, label, sub, cta, variant, icon, bg, iconBorder, iconColor }) => (
          <div
            key={href}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: bg,
                border: `1px solid ${iconBorder}`,
                display: "grid",
                placeItems: "center",
                color: iconColor,
              }}
              aria-hidden="true"
            >
              {icon}
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  margin: "0 0 var(--space-2)",
                }}
              >
                {label}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                {sub}
              </p>
            </div>
            <Link href={href} className={`btn ${variant}`} style={{ alignSelf: "flex-start" }}>
              {cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
