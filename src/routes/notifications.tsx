import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "~/lib/notifications";
import { LoadingPage } from "~/components/LoadingSpinner";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const result = await getNotifications();
      setNotifications(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await markAsRead({ data: notif.id });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        );
      } catch {
        // ignore
      }
    }
    if (notif.link) {
      navigate({ to: notif.link as any });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <main
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "480px", padding: "32px" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>Log in required</h1>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            View your notifications after logging in.
          </p>
          <Link to="/login">Log in</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return <LoadingPage message="Loading notifications..." />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main
      style={{
        minHeight: "80vh",
        padding: "48px 16px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "min(700px, 100%)", margin: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-.03em",
              margin: 0,
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: ".85rem",
                  color: "var(--muted)",
                  fontWeight: 400,
                  marginLeft: "8px",
                }}
              >
                ({unreadCount} unread)
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "8px 14px",
                fontWeight: 600,
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
                font: "inherit",
                fontSize: ".85rem",
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔔</div>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>No notifications yet</p>
            <p style={{ fontSize: ".92rem", marginTop: "8px" }}>
              When you book a call or receive a review, you&apos;ll see
              notifications here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  padding: "16px 20px",
                  background: notif.read ? "var(--card)" : "var(--card)",
                  border: `1px solid ${notif.read ? "var(--line)" : "var(--accent)"}`,
                  borderLeft: notif.read
                    ? "4px solid var(--line)"
                    : "4px solid var(--accent)",
                  borderRadius: "14px",
                  cursor: notif.link ? "pointer" : "default",
                  transition: "all 0.15s",
                  opacity: notif.read ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <strong style={{ fontSize: ".95rem" }}>{notif.title}</strong>
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: ".78rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(notif.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </div>
                {notif.message && (
                  <p
                    style={{
                      color: "var(--muted)",
                      margin: "6px 0 0",
                      fontSize: ".9rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {notif.message}
                  </p>
                )}
                {!notif.read && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "inline-block",
                      background: "#fff1e9",
                      color: "var(--accent)",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: ".7rem",
                      fontWeight: 700,
                    }}
                  >
                    New
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
