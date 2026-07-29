import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { getBooking } from "~/lib/bookings";

export const Route = createFileRoute("/call/$bookingId/")({
  component: CallPage,
});

function CallPage() {
  const { bookingId } = Route.useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await getBooking({ data: bookingId });
        setBooking(result);
        if (result && result.status !== "paid" && result.status !== "completed") {
          setError("This call is not available yet. Payment must be completed first.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

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
        <div style={{ textAlign: "center" }}>
          <h1>Log in required</h1>
          <Link to="/login">Log in</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--muted)" }}>Loading call...</p>
      </main>
    );
  }

  if (error || !booking) {
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
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 12px" }}>
            {error ? "Call unavailable" : "Booking not found"}
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            {error || "This booking doesn't exist or you don't have access."}
          </p>
          <Link to="/bookings">Back to my bookings</Link>
        </div>
      </main>
    );
  }

  const isExplorer = booking.explorer_id === user.id;
  const otherName = isExplorer
    ? booking.pathmate?.full_name || "PathMate"
    : booking.explorer?.full_name || "Explorer";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "var(--card)",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}
      >
        <div>
          <strong style={{ fontSize: ".95rem" }}>
            Call with {otherName}
          </strong>
          <span
            style={{
              marginLeft: "12px",
              display: "inline-block",
              borderRadius: "999px",
              padding: "3px 8px",
              fontSize: ".75rem",
              fontWeight: 700,
              background: "#ecfdf3",
              color: "#067647",
            }}
          >
            Jitsi Meet
          </span>
        </div>
        <Link
          to="/bookings"
          style={{
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "6px 12px",
            fontWeight: 600,
            fontSize: ".85rem",
            background: "transparent",
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          Leave
        </Link>
      </div>

      {/* Jitsi iframe */}
      <iframe
        src={`https://meet.jit.si/pathmates-${bookingId}`}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
        }}
        allow="camera; microphone; fullscreen; display-capture"
      />
    </div>
  );
}
