import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Event Photo Face-Matching",
  description: "Find yourself in event photos using face matching",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="app-header-inner">
              <Link href="/" className="brand" aria-label="Go to homepage">
                <span className="brand-badge">AI</span>
                <span>Event Match</span>
              </Link>
              <nav className="nav-links" aria-label="Primary">
                <Link className="nav-link" href="/">
                  Home
                </Link>
                <Link className="nav-link" href="/admin">
                  Organizer
                </Link>
                <Link className="nav-link" href="/match">
                  Attendee
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
