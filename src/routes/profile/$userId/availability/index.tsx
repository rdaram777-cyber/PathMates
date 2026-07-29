import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "~/lib/auth";
import {
  getMyAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
} from "~/lib/bookings";
import { StarRating } from "~/components/StarRating";
import { getPathmateRating } from "~/lib/reviews";
import type { PathmateRating } from "~/lib/reviews";

export const Route = createFileRoute("/profile/$userId/availability/")({
  component: AvailabilityPage,
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

function formatTime12(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function AvailabilityPage() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ratingData, setRatingData] = useState<PathmateRating | null>(null);

  const isOwn = user?.id === userId;

  useEffect(() => {
    getPathmateRating(userId).then(setRatingData).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!isOwn) {
      navigate({ to: "/profile/$userId", params: { userId } });
      return;
    }
    loadSlots();
  }, [userId, user]);

  async function loadSlots() {
    try {
      const result = await getMyAvailability();
      setSlots(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      setSaving(false);
      return;
    }

    try {
      await addAvailabilitySlot({
        data: {
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        },
      });
      setMessage("Slot added!");
      await loadSlots();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add slot.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAvailabilitySlot({ data: id });
      await loadSlots();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete slot.",
      );
    }
  }

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

  if (!isOwn) {
    return null; // will redirect
  }

  // Group slots by day
  const slotsByDay: Record<number, any[]> = {};
  for (const slot of slots) {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = [];
    slotsByDay[slot.day_of_week].push(slot);
  }

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
            to="/profile/$userId"
            params={{ userId }}
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: ".9rem",
            }}
          >
            ← Back to profile
          </Link>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-.03em",
            margin: "0 0 8px",
          }}
        >
          Manage Availability
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          Set when you're available for calls. Explorers will see these time slots when booking.
        </p>

        {/* Rating summary */}
        {ratingData && ratingData.review_count > 0 && (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: ".95rem", marginBottom: "2px" }}>
                Your Rating
              </strong>
              <StarRating
                rating={ratingData.avg_rating}
                count={ratingData.review_count}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Add slot form */}
        <form
          onSubmit={handleAdd}
          style={{
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px" }}>
            Add a time slot
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: "4px",
                  fontSize: ".85rem",
                }}
              >
                Day
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "var(--bg)",
                  font: "inherit",
                  fontSize: ".9rem",
                }}
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: "4px",
                  fontSize: ".85rem",
                }}
              >
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "var(--bg)",
                  font: "inherit",
                  fontSize: ".9rem",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: "4px",
                  fontSize: ".85rem",
                }}
              >
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "var(--bg)",
                  font: "inherit",
                  fontSize: ".9rem",
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: 700,
              background: saving ? "#ccc" : "var(--accent)",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              font: "inherit",
              fontSize: ".9rem",
            }}
          >
            {saving ? "Adding..." : "Add Slot"}
          </button>
          {error && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "8px",
                background: "#fff0ee",
                color: "#b42318",
                fontSize: ".85rem",
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "8px",
                background: "#ecfdf3",
                color: "#067647",
                fontSize: ".85rem",
              }}
            >
              {message}
            </div>
          )}
        </form>

        {/* Existing slots */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px" }}>
          Your availability ({slots.length} slots)
        </h2>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : slots.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No availability set. Add your first time slot above.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {DAY_NAMES.map((name, dayIdx) => {
              const daySlots = slotsByDay[dayIdx];
              if (!daySlots?.length) return null;
              return (
                <div
                  key={dayIdx}
                  style={{
                    padding: "16px 20px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "8px", fontSize: ".95rem" }}>
                    {name}
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          background: "#fff5f0",
                          borderRadius: "8px",
                          fontSize: ".85rem",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {formatTime12(slot.start_time)} –{" "}
                          {formatTime12(slot.end_time)}
                        </span>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#b42318",
                            cursor: "pointer",
                            fontSize: ".85rem",
                            fontWeight: 700,
                            padding: "0 2px",
                          }}
                          title="Delete slot"
                        >
                          ×
                        </button>
                      </div>
                    ))}
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
