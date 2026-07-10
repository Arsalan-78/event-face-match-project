import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "FaceMatch — AI Photo Matching for Events",
  description:
    "Find yourself in event photos in seconds. Organizers upload galleries, attendees upload one selfie — our AI does the rest.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header" role="banner">
            <div className="app-header-inner">
              {/* Brand */}
              <Link href="/" className="brand" aria-label="FaceMatch — go to homepage">
                <span className="brand-badge" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="5.5" r="2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M3 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="12.5" cy="5.5" r="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M14 10.5c.5.5.75 1.1.875 1.75" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>FaceMatch</span>
              </Link>

              {/* Navigation */}
              <nav className="nav-links" aria-label="Primary navigation">
                <Link className="nav-link" href="/">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Home
                </Link>
                <Link className="nav-link" href="/admin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Organizer
                </Link>
                <Link className="nav-link" href="/match">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Find My Photos
                </Link>
              </nav>
            </div>
          </header>

          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
