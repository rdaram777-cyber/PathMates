import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { StarRatingInline } from "~/components/StarRating";
import { getExperience } from "~/lib/experiences";
import {
  getPathmateProfile,
  getPathmateAvailability,
  createBooking,
} from "~/lib/bookings";
import {
  getUserCurrency,
  formatTierPrice,
  TIER_DURATIONS,
  type CurrencyCode,
  type TierDuration,
} from "~/lib/currency";

export const Route = createFileRoute("/book/$experienceId/")({
  loader: async ({ params }) => {
    const experience = await getExperience({ data: params.experienceId });
    if (!experience) return { experience: null, profile: null, slots: [] };

    const [profile, slots] = await Promise.all([
      getPathmateProfile({ data: experience.user_id }),
      getPathmateAvailability({ data: experience.user_id }),
    ]);

    return { experience, profile, slots };
  },
  component: BookPage,
});

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getAvailableDates(slots: any[], daysAhead: number): Date[] {
  const availableDays = new Set(slots.map((s) => s.day_of_week));
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (availableDays.has(d.getDay())) {
      dates.push(d);
    }
  }
  return dates;
}

function getTimeSlotsForDate(
  slots: any[],
  date: Date,
): { start: string; end: string }[] {
  const dayOfWeek = date.getDay();
  return slots
    .filter((s) => s.day_of_week === dayOfWeek)
    .map((s) => ({ start: s.start_time, end: s.end_time }));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function BookPage() {
  const { experience, profile, slots } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<TierDuration>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Currency detection: default to USD for SSR/first paint, then switch to the
  // user's detected currency (₹ for India, $ for everyone else) after mount.
  const [currency, setCurrency] = useState<{ code: CurrencyCode; symbol: string }>(
    { code: "USD", symbol: "$" },
  );
  useEffect(() => {
    setCurrency(getUserCurrency());
  }, []);

  // Redirect to login if not authenticated
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
            You need to log in before booking a call.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-block",
              border: "none",
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: 700,
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (!experience || !profile) {
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
            Experience not found
          </h1>
          <Link to="/">Back to home</Link>
        </div>
      </main>
    );
  }

  const availableDates = getAvailableDates(slots, 14);
  const timeSlots = selectedDate
    ? getTimeSlotsForDate(slots, selectedDate)
    : [];
  // Fixed tier pricing — prices come from the platform-wide table,
  // not from the PathMate's hourly_rate.

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    setError("");

    try {
      const [h, m] = selectedTime.split(":");
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      const result = await createBooking({
        data: {
          pathmate_id: experience.user_id,
          experience_id: experience.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          currency: currency.code,
          pathmate_name:
            experience.profiles?.full_name || profile.full_name || "PathMate",
          experience_title: experience.title,
        },
      });

      // Redirect to Stripe Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create booking.",
      );
      setLoading(false);
    }
  };

  const initials = (profile.full_name || "P")[0].toUpperCase();

  return (
    <main
      style={{
        minHeight: "80vh",
        padding: "48px 16px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "min(700px, 100%)", margin: "auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <Link
            to="/experiences/$experienceId"
            params={{ experienceId: experience.id }}
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: ".9rem",
            }}
          >
            ← Back to experience
          </Link>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-.03em",
            margin: "0 0 24px",
          }}
        >
          Book a call
        </h1>

        {/* PathMate info card */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            padding: "20px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fff1e9",
              color: "#c85b2e",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "1.3rem",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <strong style={{ fontSize: "1.1rem", display: "block" }}>
              {profile.full_name || "PathMate"}
            </strong>
            {profile.bio_short && (
              <small style={{ color: "var(--muted)" }}>
                {profile.bio_short}
              </small>
            )}
            <div
              style={{
                marginTop: "4px",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              Sessions from {formatTierPrice(15, currency)}
            </div>
            <div style={{ marginTop: "4px" }}>
              <StarRatingInline rating={profile.avg_rating ?? 0} count={profile.review_count ?? 0} />
            </div>
          </div>
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>
            Select a date
          </h2>
          {availableDates.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              This PathMate hasn't set their availability yet. Check back soon!
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "8px",
              }}
            >
              {availableDates.map((d) => {
                const key = d.toISOString().slice(0, 10);
                const isSelected =
                  selectedDate?.toISOString().slice(0, 10) === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                    style={{
                      border: isSelected
                        ? "2px solid var(--accent)"
                        : "1px solid var(--line)",
                      borderRadius: "12px",
                      padding: "12px",
                      background: isSelected ? "#fff5f0" : "var(--card)",
                      color: isSelected ? "var(--accent)" : "var(--text)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: ".9rem",
                      font: "inherit",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(d)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Time slot picker */}
        {selectedDate && timeSlots.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Select a start time for {formatDate(selectedDate)}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "8px",
              }}
            >
              {timeSlots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedTime(slot.start)}
                  style={{
                    border:
                      selectedTime === slot.start
                        ? "2px solid var(--accent)"
                        : "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "12px",
                    background:
                      selectedTime === slot.start
                        ? "#fff5f0"
                        : "var(--card)",
                    color:
                      selectedTime === slot.start
                        ? "var(--accent)"
                        : "var(--text)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: ".9rem",
                    font: "inherit",
                    textAlign: "center",
                  }}
                >
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration selector */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}
          >
            Duration
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {TIER_DURATIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => setDuration(mins)}
                style={{
                  border:
                    duration === mins
                      ? "2px solid var(--accent)"
                      : "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  background:
                    duration === mins ? "#fff5f0" : "var(--card)",
                  color:
                    duration === mins ? "var(--accent)" : "var(--text)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: ".9rem",
                  font: "inherit",
                }}
              >
                <span style={{ display: "block" }}>{mins} min</span>
                <span
                  style={{
                    display: "block",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    opacity: 0.8,
                  }}
                >
                  {formatTierPrice(mins, currency)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Price display & confirm */}
        {selectedDate && selectedTime && (
          <div
            style={{
              padding: "24px",
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "1rem" }}>
                  Total
                </strong>
                <small style={{ color: "var(--muted)" }}>
                  {duration} minutes · session price
                </small>
              </div>
              <div
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}
              >
                {formatTierPrice(duration, currency)}
              </div>
            </div>
            <button
              onClick={handleBook}
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "12px",
                padding: "16px",
                fontWeight: 700,
                fontSize: "1.05rem",
                background: loading ? "#ccc" : "var(--accent)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                font: "inherit",
              }}
            >
              {loading ? "Creating booking..." : "Confirm & Pay"}
            </button>
            {error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#fff0ee",
                  color: "#b42318",
                  fontSize: ".9rem",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
