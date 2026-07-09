import Link from "next/link";

export default function Home() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <h1 className="title">AI Photo Matching for Events</h1>
        <p className="subtitle">
          A fast, private face-matching workflow for event teams. Organizers upload event galleries,
          attendees upload one selfie, and the platform finds their photos in seconds.
        </p>
      </section>

      <section className="grid grid-3" aria-label="Platform highlights">
        <article className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0 }}>1. Upload & Index</h3>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Organizers upload event images and the system indexes every detected face.
            </p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0 }}>2. Selfie Match</h3>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Attendees submit one selfie plus event ID and trigger similarity search.
            </p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0 }}>3. Premium Results</h3>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Matched photos appear with confidence details and instant preview.
            </p>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-body">
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Choose your flow</h2>
          <p className="subtitle" style={{ marginBottom: 16 }}>
            Keep the exact workflow you already use — now with a production-style interface.
          </p>
          <div className="btn-row">
            <Link href="/admin" className="btn btn-primary">
              I&apos;m the organizer
            </Link>
            <Link href="/match" className="btn btn-secondary">
              I&apos;m an attendee
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
