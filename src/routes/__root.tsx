import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { AuthProvider, useAuth } from "~/lib/auth";
import { ThemeProvider, useTheme } from "~/lib/theme";
import { getUnreadCount } from "~/lib/notifications";
import { supabase } from "~/lib/supabase";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PathMates — Real experience. Real people. Real paths." },
      {
        name: "description",
        content:
          "Find people who have actually lived through the experience you're considering. Book 1:1 video calls with PathMates who've walked the path before you.",
      },
      { property: "og:title", content: "PathMates — Real experience. Real people. Real paths." },
      {
        property: "og:description",
        content:
          "Find people who have actually lived through the experience you're considering.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://site-virid-eight-86.vercel.app/",
      },
      { property: "og:site_name", content: "PathMates" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "PathMates" },
      {
        name: "twitter:description",
        content: "Find someone who's already walked the path.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://site-virid-eight-86.vercel.app/" },
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
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </RootDocument>
  );
}

function AppShell() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
    // Poll every 30 seconds
    const interval = setInterval(() => {
      getUnreadCount()
        .then(setUnreadCount)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Check if user is admin
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    void Promise.resolve(
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    )
      .then(({ data }) => setIsAdmin(data?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [user]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, []);

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user?.email || "",
      });
      if (!error) {
        alert("Verification email resent! Check your inbox.");
      } else {
        alert("Could not resend. Please try again later.");
      }
    } catch {
      alert("Could not resend. Please try again later.");
    }
  };

  const isEmailUnverified = user && !user.email_confirmed_at;

  return (
    <>
      {/* Email verification banner */}
      {isEmailUnverified && (
        <div
          style={{
            background: "#fff1e9",
            color: "#c85b2e",
            textAlign: "center",
            padding: "10px 16px",
            fontSize: ".9rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span>⚠️ Verify your email to unlock all features.</span>
          <button
            onClick={handleResendVerification}
            style={{
              border: "1px solid #c85b2e",
              borderRadius: "8px",
              padding: "6px 12px",
              fontWeight: 700,
              background: "transparent",
              color: "#c85b2e",
              cursor: "pointer",
              font: "inherit",
              fontSize: ".82rem",
            }}
          >
            Resend verification
          </button>
        </div>
      )}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(10px)",
          opacity: 0.97,
        }}
      >
        <div className="nav-container">
          <Link
            to="/"
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              textDecoration: "none",
              color: "var(--text)",
              flexShrink: 0,
            }}
          >
            Path<span style={{ color: "var(--accent)" }}>Mates</span>
          </Link>

          <nav className="nav-links" style={{ color: "var(--muted)" }}>
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
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "8px",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "44px",
                minHeight: "44px",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {authLoading ? null : user ? (
              <>
                {/* Notification bell */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label="Notifications"
                    style={{
                      position: "relative",
                      border: "1px solid var(--line)",
                      borderRadius: "10px",
                      padding: "8px",
                      background: "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                      minWidth: "44px",
                      minHeight: "44px",
                      fontSize: "1.1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="notif-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  {notifOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: "340px",
                        maxHeight: "400px",
                        overflowY: "auto",
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        borderRadius: "14px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                        zIndex: 100,
                      }}
                    >
                      <NotifDropdown
                        onClose={() => setNotifOpen(false)}
                      />
                    </div>
                  )}
                </div>

                <Link
                  to="/bookings"
                  className="nav-links"
                  style={{
                    color: "var(--muted)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    style={{
                      color: "#c85b2e",
                      textDecoration: "none",
                      fontWeight: 700,
                      background: "#fff1e9",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      fontSize: ".85rem",
                    }}
                  >
                    ⚙ Admin
                  </Link>
                )}
                <Link
                  to="/profile/$userId"
                  params={{ userId: user.id }}
                  className="nav-links"
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
                  className="btn btn-outline nav-links"
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
                  className="btn btn-outline nav-links"
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

            {/* Hamburger */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
          <a
            href="/#explore"
            style={{
              display: "block",
              padding: "12px 0",
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Explore
          </a>
          <a
            href="/#how"
            style={{
              display: "block",
              padding: "12px 0",
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
            }}
            onClick={() => setMobileOpen(false)}
          >
            How it works
          </a>
          <Link
            to="/share"
            style={{
              display: "block",
              padding: "12px 0",
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Share your experience
          </Link>

          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />

          {user ? (
            <>
              <Link
                to="/bookings"
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                My Bookings
              </Link>
              <Link
                to="/profile/$userId"
                params={{ userId: user.id }}
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                My Profile
              </Link>
              <Link
                to="/notifications"
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                Notifications
                {unreadCount > 0 && (
                  <span style={{ color: "var(--accent)", marginLeft: "6px" }}>
                    ({unreadCount})
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  color: "var(--muted)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
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
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 24px",
                  fontWeight: 700,
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                  textAlign: "center",
                }}
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
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

/** Notification dropdown content (loaded on open) */
function NotifDropdown({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("~/lib/notifications")
      .then((m) => m.getNotifications())
      .then((data) => setNotifs(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: ".9rem" }}>
        Loading...
      </div>
    );
  }

  if (notifs.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: ".9rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
        No notifications yet
      </div>
    );
  }

  return (
    <div>
      {notifs.map((n) => (
        <Link
          key={n.id}
          to={n.link || "/notifications"}
          onClick={onClose}
          style={{
            display: "block",
            padding: "14px 18px",
            textDecoration: "none",
            color: "var(--text)",
            borderBottom: "1px solid var(--line)",
            opacity: n.read ? 0.65 : 1,
          }}
        >
          <div style={{ fontWeight: n.read ? 500 : 700, fontSize: ".9rem", marginBottom: "2px" }}>
            {!n.read && (
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  marginRight: "6px",
                  verticalAlign: "middle",
                  marginTop: "-2px",
                }}
              />
            )}
            {n.title}
          </div>
          {n.message && (
            <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: "2px" }}>
              {n.message.length > 80 ? n.message.slice(0, 80) + "..." : n.message}
            </div>
          )}
          <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: "4px" }}>
            {new Date(n.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </Link>
      ))}
      <Link
        to="/notifications"
        onClick={onClose}
        style={{
          display: "block",
          textAlign: "center",
          padding: "12px",
          color: "var(--accent)",
          fontWeight: 700,
          fontSize: ".85rem",
          textDecoration: "none",
        }}
      >
        View all notifications →
      </Link>
    </div>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Prevent FOUC for dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('pathmates-theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
