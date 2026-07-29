import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "~/lib/auth";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PathMates — Real experience. Real people. Real paths." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </RootDocument>
  );
}

function AppShell() {
  const { user, loading, signOut } = useAuth();

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(251,250,247,.95)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="nav-container"
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
            minHeight: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            Path<span style={{ color: "var(--accent)" }}>Mates</span>
          </Link>

          <nav
            style={{
              display: "flex",
              gap: "22px",
              color: "var(--muted)",
            }}
            className="nav-links"
          >
            <a href="/#explore" style={{ textDecoration: "none", color: "inherit" }}>
              Explore
            </a>
            <a href="/#how" style={{ textDecoration: "none", color: "inherit" }}>
              How it works
            </a>
            <Link to="/share" style={{ textDecoration: "none", color: "inherit" }}>
              Share your experience
            </Link>
          </nav>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {loading ? null : user ? (
              <>
                <Link
                  to="/bookings"
                  style={{
                    color: "var(--muted)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  My Bookings
                </Link>
                <Link
                  to="/profile/$userId"
                  params={{ userId: user.id }}
                  style={{
                    color: "var(--muted)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {user.user_metadata?.full_name || user.email}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="btn btn-outline"
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontWeight: 700,
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: "inherit",
                    font: "inherit",
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline"
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontWeight: 700,
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    textDecoration: "none",
                    fontSize: "inherit",
                  }}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary"
                  style={{
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontWeight: 700,
                    background: "var(--accent)",
                    color: "#fff",
                    cursor: "pointer",
                    textDecoration: "none",
                    fontSize: "inherit",
                  }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Outlet />

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "25px 0",
          color: "var(--muted)",
          fontSize: ".9rem",
        }}
      >
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          © 2026 PathMates. Built for real journeys.
        </div>
      </footer>
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
