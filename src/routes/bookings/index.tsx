import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { getUserBookings } from "~/lib/bookings";
import type { BookingWithDetails } from "~/lib/bookings";

export const Route = createFileRoute("/bookings/")({
  component: BookingsPage,
});

function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"explorer" | "pathmate">("explorer");

  useEffect(() => {
    async function load() {
      try {
        const result = await getUserBookings();
        setBookings(result);
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

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
        <div
          style={{ textAlign: "center", maxWidth: "480px", padding: "32px" }}
        >
          <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>Log in required</h1>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            View your bookings after logging in.
          </p>
          <Link to="/login">Log in</Link>
        </div>
      </main>
    );
  }

  const explorerBookings = bookings.filter(
    (b) => b.explorer_id === user.id,
  );
  const pathmateBookings = bookings.filter(
    (b) => b.pathmate_id === user.id,
  );

  const currentBookings = tab === "explorer" ? explorerBookings : pathmateBookings;

  return (
    <main
      style={{
        minHeight: "80vh",
        padding: "48px 16px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "min(800px, 100%)", margin: "auto" }}>
        <h1
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-.03em",
            margin: "0 0 24px",
          }}
        >
          My Bookings
        </h1>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "24px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <button
            onClick={() => setTab("explorer")}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "transparent",
              fontWeight: 700,
              color:
                tab === "explorer" ? "var(--accent)" : "var(--muted)",
              borderBottom:
                tab === "explorer"
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              cursor: "pointer",
              font: "inherit",
              fontSize: ".95rem",
            }}
          >
            As Explorer ({explorerBookings.length})
          </button>
          <button
            onClick={() => setTab("pathmate")}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "transparent",
              fontWeight: 700,
              color:
                tab === "pathmate" ? "var(--accent)" : "var(--muted)",
              borderBottom:
                tab === "pathmate"
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              cursor: "pointer",
              font: "inherit",
              fontSize: ".95rem",
            }}
          >
            As PathMate ({pathmateBookings.length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>
            Loading...
          </p>
        ) : currentBookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--muted)", marginBottom: "16px" }}>
              {tab === "explorer"
                ? "You haven't made any bookings yet."
                : "No one has booked a call with you yet."}
            </p>
            {tab === "explorer" && (
              <Link
                to="/"
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  fontWeight: 700,
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Explore experiences
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {currentBookings.map((booking) => {
              const otherName =
                tab === "explorer"
                  ? booking.pathmate?.full_name || "PathMate"
                  : booking.explorer?.full_name || "Explorer";
              const initials = otherName[0].toUpperCase();

              return (
                <div
                  key={booking.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#fff1e9",
                      color: "#c85b2e",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: ".95rem" }}>
                      {tab === "explorer" ? "Call with " : "Call for "}
                      {otherName}
                    </strong>
                    <small style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                      {new Date(booking.scheduled_at).toLocaleString(
                        "en-US",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}{" "}
                      · {booking.duration_minutes} min · $
                      {(booking.amount_cents / 100).toFixed(2)}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: ".78rem",
                        fontWeight: 700,
                        background:
                          booking.status === "paid"
                            ? "#ecfdf3"
                            : booking.status === "pending"
                              ? "#fffaeb"
                              : booking.status === "cancelled"
                                ? "#fef2f2"
                                : "#f2f4f7",
                        color:
                          booking.status === "paid"
                            ? "#067647"
                            : booking.status === "pending"
                              ? "#b54708"
                              : booking.status === "cancelled"
                                ? "#b42318"
                                : "#475467",
                      }}
                    >
                      {booking.status}
                    </span>
                    {(booking.status === "paid" ||
                      booking.status === "completed") &&
                      booking.meeting_url && (
                        <Link
                          to="/call/$bookingId"
                          params={{ bookingId: booking.id }}
                          style={{
                            display: "inline-block",
                            border: "none",
                            borderRadius: "10px",
                            padding: "8px 14px",
                            fontWeight: 700,
                            fontSize: ".85rem",
                            background: "var(--accent)",
                            color: "#fff",
                            textDecoration: "none",
                          }}
                        >
                          Join
                        </Link>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
