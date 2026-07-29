import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { getUserBookings } from "~/lib/bookings";
import { getBookingReview, createReview, updateReview, deleteReview } from "~/lib/reviews";
import type { BookingWithDetails } from "~/lib/bookings";
import type { Review } from "~/lib/reviews";
import { StarRating } from "~/components/StarRating";

export const Route = createFileRoute("/bookings/")({
  component: BookingsPage,
});

function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"explorer" | "pathmate">("explorer");

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    bookingId: string;
    pathmateName: string;
    existingReview?: Review;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  // Map of bookingId -> Review (for existing reviews)
  const [bookingReviews, setBookingReviews] = useState<
    Record<string, Review | null>
  >({});

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

  // Load reviews for explorer bookings that are paid/completed
  useEffect(() => {
    if (!user) return;
    const explorerPaid = bookings.filter(
      (b) =>
        b.explorer_id === user.id &&
        (b.status === "paid" || b.status === "completed"),
    );
    Promise.all(
      explorerPaid.map(async (b) => {
        try {
          const review = await getBookingReview(b.id);
          return { bookingId: b.id, review };
        } catch {
          return { bookingId: b.id, review: null };
        }
      }),
    ).then((results) => {
      const map: Record<string, Review | null> = {};
      for (const r of results) {
        map[r.bookingId] = r.review;
      }
      setBookingReviews((prev) => ({ ...prev, ...map }));
    });
  }, [bookings, user]);

  const openReviewModal = (booking: BookingWithDetails, existing?: Review) => {
    setReviewRating(existing?.rating ?? 5);
    setReviewContent(existing?.content ?? "");
    setReviewError("");
    setReviewModal({
      open: true,
      bookingId: booking.id,
      pathmateName: booking.pathmate?.full_name || "PathMate",
      existingReview: existing,
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setReviewSaving(true);
    setReviewError("");

    try {
      if (reviewModal.existingReview) {
        await updateReview({
          review_id: reviewModal.existingReview.id,
          rating: reviewRating,
          content: reviewContent || undefined,
        });
      } else {
        await createReview({
          booking_id: reviewModal.bookingId,
          rating: reviewRating,
          content: reviewContent || undefined,
        });
      }

      // Refresh reviews
      const updated = await getBookingReview(reviewModal.bookingId);
      setBookingReviews((prev) => ({
        ...prev,
        [reviewModal.bookingId]: updated,
      }));
      setReviewModal(null);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to save review.",
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewModal?.existingReview) return;
    setReviewSaving(true);
    setReviewError("");

    try {
      await deleteReview(reviewModal.existingReview.id);
      setBookingReviews((prev) => ({
        ...prev,
        [reviewModal.bookingId]: null,
      }));
      setReviewModal(null);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to delete review.",
      );
    } finally {
      setReviewSaving(false);
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

  const currentBookings =
    tab === "explorer" ? explorerBookings : pathmateBookings;

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
          <p
            style={{
              color: "var(--muted)",
              textAlign: "center",
              padding: "40px",
            }}
          >
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {currentBookings.map((booking) => {
              const otherName =
                tab === "explorer"
                  ? booking.pathmate?.full_name || "PathMate"
                  : booking.explorer?.full_name || "Explorer";
              const initials = otherName[0].toUpperCase();
              const isPaidOrCompleted =
                booking.status === "paid" || booking.status === "completed";
              const existingReview = bookingReviews[booking.id];

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
                    flexWrap: "wrap",
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
                    <small
                      style={{ color: "var(--muted)", fontSize: ".85rem" }}
                    >
                      {new Date(booking.scheduled_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {booking.duration_minutes} min · $
                      {(booking.amount_cents / 100).toFixed(2)}
                    </small>
                    {/* Show existing review stars if present */}
                    {existingReview && (
                      <div style={{ marginTop: "4px" }}>
                        <StarRating rating={existingReview.rating} size="sm" />
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
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
                            : booking.status === "completed"
                              ? "#eef2ff"
                              : booking.status === "pending"
                                ? "#fffaeb"
                                : booking.status === "cancelled"
                                  ? "#fef2f2"
                                  : "#f2f4f7",
                        color:
                          booking.status === "paid"
                            ? "#067647"
                            : booking.status === "completed"
                              ? "#4f46e5"
                              : booking.status === "pending"
                                ? "#b54708"
                                : booking.status === "cancelled"
                                  ? "#b42318"
                                  : "#475467",
                      }}
                    >
                      {booking.status}
                    </span>

                    {/* Review button (explorer only, paid/completed) */}
                    {tab === "explorer" && isPaidOrCompleted && (
                      <button
                        onClick={() =>
                          openReviewModal(
                            booking,
                            existingReview ?? undefined,
                          )
                        }
                        style={{
                          display: "inline-block",
                          border: existingReview
                            ? "1px solid var(--accent)"
                            : "none",
                          borderRadius: "10px",
                          padding: "8px 14px",
                          fontWeight: 700,
                          fontSize: ".85rem",
                          background: existingReview
                            ? "transparent"
                            : "var(--accent)",
                          color: existingReview
                            ? "var(--accent)"
                            : "#fff",
                          cursor: "pointer",
                          font: "inherit",
                        }}
                      >
                        {existingReview ? "Edit Review" : "Leave a Review"}
                      </button>
                    )}

                    {/* Join button */}
                    {isPaidOrCompleted && booking.meeting_url && (
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

      {/* Review Modal */}
      {reviewModal?.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setReviewModal(null)}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "460px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "1.3rem",
                letterSpacing: "-.02em",
              }}
            >
              {reviewModal.existingReview ? "Edit your review" : "Leave a review"}
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: "20px", fontSize: ".9rem" }}>
              How was your call with {reviewModal.pathmateName}?
            </p>

            {/* Star picker */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setReviewRating(star)}
                  style={{
                    fontSize: "2rem",
                    cursor: "pointer",
                    color: star <= reviewRating ? "#f5a623" : "#d4d8df",
                    transition: "transform 0.1s",
                    userSelect: "none",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your experience (optional)..."
              rows={4}
              style={{
                width: "100%",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "12px",
                fontSize: ".92rem",
                font: "inherit",
                resize: "vertical",
                background: "var(--bg)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            />

            {reviewError && (
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
                {reviewError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                justifyContent: "flex-end",
              }}
            >
              {reviewModal.existingReview && (
                <button
                  onClick={handleDeleteReview}
                  disabled={reviewSaving}
                  style={{
                    border: "1px solid #fca5a5",
                    borderRadius: "12px",
                    padding: "12px 18px",
                    fontWeight: 700,
                    background: "transparent",
                    color: "#b42318",
                    cursor: reviewSaving ? "not-allowed" : "pointer",
                    fontSize: ".9rem",
                    font: "inherit",
                    marginRight: "auto",
                  }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setReviewModal(null)}
                disabled={reviewSaving}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontWeight: 700,
                  background: "transparent",
                  color: "var(--text)",
                  cursor: reviewSaving ? "not-allowed" : "pointer",
                  fontSize: ".9rem",
                  font: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewSaving}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontWeight: 700,
                  background: reviewSaving ? "#ccc" : "var(--accent)",
                  color: "#fff",
                  cursor: reviewSaving ? "not-allowed" : "pointer",
                  fontSize: ".9rem",
                  font: "inherit",
                }}
              >
                {reviewSaving
                  ? "Saving..."
                  : reviewModal.existingReview
                    ? "Update"
                    : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
