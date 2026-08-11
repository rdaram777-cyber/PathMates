import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { getBooking, confirmBooking } from "~/lib/bookings";
import { getExperience } from "~/lib/experiences";
import { formatAmountCents } from "~/lib/currency";

export const Route = createFileRoute("/bookings/$bookingId/success")({
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { bookingId } = Route.useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [experienceTitle, setExperienceTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getBooking({ data: bookingId });
        setBooking(result);
        // Fetch the experience title so the confirmation shows what was booked.
        if (result?.experience_id) {
          const exp = await getExperience({ data: result.experience_id });
          setExperienceTitle(exp?.title ?? null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load booking.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const result = await confirmBooking({ data: bookingId });
      setMeetingUrl(result.meetingUrl);
      // Refresh the booking from the server so the status badge flips to
      // "paid" and any meeting details are reflected in the UI.
      const updated = await getBooking({ data: bookingId });
      if (updated) setBooking(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment verification failed.",
      );
    } finally {
      setConfirming(false);
    }
  };

  // Auto-confirm on load (Stripe flow only — Razorpay bookings are confirmed
  // by confirmRazorpayBooking immediately after payment)
  useEffect(() => {
    if (booking && booking.status === "pending" && !meetingUrl) {
      if (booking.payment_gateway === "razorpay") {
        setLoading(false);
        return;
      }
      handleConfirm();
    } else if (booking && booking.status === "paid") {
      setMeetingUrl(booking.meeting_url);
    }
  }, [booking]);

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
          <Link to="/login">Log in</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--muted)" }}>Loading...</p>
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
          <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>
            Booking not found
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            {error || "We couldn't find this booking."}
          </p>
          <Link to="/bookings">View my bookings</Link>
        </div>
      </main>
    );
  }

  const isPaid = booking.status === "paid";
  const mentorName = booking.pathmate?.full_name || "your PathMate";

  return (
    <main
      style={{
        minHeight: "80vh",
        padding: "48px 16px",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          width: "min(600px, 100%)",
          margin: "auto",
          textAlign: "center",
        }}
      >
        {/* Success icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#ecfdf3",
            color: "#067647",
            display: "grid",
            placeItems: "center",
            fontSize: "2.5rem",
            margin: "0 auto 24px",
            fontWeight: 800,
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            margin: "0 0 12px",
          }}
        >
          {isPaid
            ? "Payment successful! Your call is confirmed 🎉"
            : "Booking confirmed!"}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          Your call with <strong>{mentorName}</strong>
          {experienceTitle ? (
            <>
              {" "}
              about <strong>“{experienceTitle}”</strong>
            </>
          ) : null}{" "}
          has been scheduled.
        </p>

        {/* Booking details */}
        <div
          style={{
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            marginBottom: "28px",
            textAlign: "left",
          }}
        >
          {experienceTitle && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "var(--muted)", flexShrink: 0 }}>
                Experience
              </span>
              <strong style={{ textAlign: "right" }}>{experienceTitle}</strong>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>PathMate</span>
            <strong>{mentorName}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Date & Time</span>
            <strong>
              {new Date(booking.scheduled_at).toLocaleString("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Duration</span>
            <strong>{booking.duration_minutes} minutes</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Amount</span>
            <strong>
              {formatAmountCents(booking.amount_cents, booking.currency)}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Status</span>
            <strong
              style={{
                color: isPaid ? "#067647" : booking.status === "pending" ? "#b54708" : "var(--text)",
              }}
            >
              {isPaid ? "Paid" : booking.status}
            </strong>
          </div>
        </div>

        {/* Meeting link */}
        {meetingUrl ? (
          <div
            style={{
              padding: "24px",
              background: "#f9f5ff",
              border: "1px solid #e9d7fe",
              borderRadius: "16px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}
            >
              Your call is ready
            </h2>
            <p
              style={{
                color: "var(--muted)",
                marginBottom: "16px",
                fontSize: ".95rem",
              }}
            >
              Join your video call at the scheduled time.
            </p>
            <Link
              to="/call/$bookingId"
              params={{ bookingId: booking.id }}
              style={{
                display: "inline-block",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              Join your call
            </Link>
          </div>
        ) : (
          <p
            style={{
              color: "var(--muted)",
              fontSize: ".95rem",
              margin: "0 0 24px",
            }}
          >
            Open{" "}
            <Link to="/bookings" style={{ color: "var(--accent)", fontWeight: 700 }}>
              My Bookings
            </Link>{" "}
            to get your call link.
          </p>
        )}

        {confirming && (
          <p style={{ color: "var(--muted)", marginBottom: "16px" }}>
            Verifying payment...
          </p>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link
            to="/bookings"
            style={{
              border: "1px solid var(--line)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontWeight: 700,
              background: "transparent",
              color: "var(--text)",
              textDecoration: "none",
              fontSize: ".95rem",
            }}
          >
            My Bookings
          </Link>
          <Link
            to="/"
            style={{
              border: "1px solid var(--line)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontWeight: 700,
              background: "transparent",
              color: "var(--text)",
              textDecoration: "none",
              fontSize: ".95rem",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
