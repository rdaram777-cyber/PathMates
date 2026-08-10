import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "~/lib/auth";
import { createSupabaseClient } from "~/db";
import { StarRating } from "~/components/StarRating";
import { getPathmateRating, type ReviewWithReviewer } from "~/lib/reviews";

const getProfile = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // Public read — profiles are marketplace-facing pages, so use the
    // service role to bypass the authenticated-only RLS policy.
    const sb = createSupabaseClient({ useServiceRole: true });
    const { data: profile, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return profile;
  });

export const Route = createFileRoute("/profile/$userId")({
  loader: ({ params }) => getProfile({ data: params.userId }),
  component: ProfileView,
});

function ProfileView() {
  const profile = Route.useLoaderData();
  const { user } = useAuth();
  const isOwn = user?.id === profile.id;
  const [ratingData, setRatingData] = useState<{
    avg_rating: number;
    review_count: number;
    recent_reviews: ReviewWithReviewer[];
  } | null>(null);

  useEffect(() => {
    getPathmateRating({ data: profile.id }).then(setRatingData).catch(() => {});
  }, [profile.id]);

  if (!profile) {
    return (
      <main style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Profile not found.</p>
      </main>
    );
  }

  const initials = (profile.full_name || "P")[0].toUpperCase();
  const isVerified = profile.verified;

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
          width: "min(720px, 100%)",
          margin: "auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "20px",
          padding: "32px",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#fff1e9",
              color: "#c85b2e",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "2rem",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  letterSpacing: "-.03em",
                  margin: 0,
                }}
              >
                {profile.full_name || "PathMate"}
              </h1>
              {isVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#ecfdf3",
                    color: "#067647",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: ".78rem",
                    fontWeight: 700,
                  }}
                >
                  ✓ Verified PathMate
                </span>
              )}
            </div>
            {profile.headline && (
              <p style={{ margin: "8px 0 0", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{profile.headline}</p>
            )}
            {(profile.country || profile.years_of_experience != null || profile.current_role) && (
              <div style={{ marginTop: "8px", color: "var(--muted)", fontSize: ".9rem", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {profile.country && <span>📍 {profile.country}</span>}
                {profile.years_of_experience != null && <span>{profile.years_of_experience} years of experience</span>}
                {profile.current_role && <span>{profile.current_role}</span>}
              </div>
            )}
            <div style={{ marginTop: "4px" }}>
              <StarRating
                rating={ratingData?.avg_rating ?? profile.avg_rating ?? 0}
                count={ratingData?.review_count ?? profile.review_count ?? 0}
                size="sm"
              />
            </div>
            {typeof profile.hourly_rate === "number" && profile.hourly_rate > 0 ? (
              <small
                style={{
                  display: "block",
                  color: "var(--accent)",
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                ${(profile.hourly_rate / 100).toFixed(2)}/hour
              </small>
            ) : null}
          </div>
            {/* Email verification status */}
            {isOwn && (
              <div style={{ marginTop: "6px" }}>
                {user?.email_confirmed_at ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".8rem", color: "#16803c", fontWeight: 600 }}>✓ Email verified</span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".8rem", color: "#b54708", fontWeight: 600 }}>⚠ Email not verified</span>
                )}
              </div>
            )}

          {isOwn && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Link
                to="/profile/$userId/edit"
                params={{ userId: profile.id }}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  fontWeight: 700,
                  background: "transparent",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontSize: ".9rem",
                }}
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/$userId/availability"
                params={{ userId: profile.id }}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  fontWeight: 700,
                  background: "transparent",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontSize: ".9rem",
                }}
              >
                Availability
              </Link>
            </div>
          )}
        </div>
        {profile.bio && (
          <p style={{ color: "var(--muted)", marginBottom: "20px", lineHeight: 1.6 }}>
            {profile.bio}
          </p>
        )}
        {(profile.languages?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", marginBottom: "6px", fontSize: ".9rem" }}>
              Languages
            </strong>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {profile.languages?.map((lang: string) => (
                <span
                  key={lang}
                  style={{
                    display: "inline-block",
                    background: "#f2f4f7",
                    borderRadius: "999px",
                    padding: "6px 9px",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    color: "#475467",
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
        {(profile.skills?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", marginBottom: "6px", fontSize: ".9rem" }}>
              Skills
            </strong>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {profile.skills?.map((skill: string) => (
                <span
                  key={skill}
                  style={{
                    display: "inline-block",
                    background: "#fff1e9",
                    borderRadius: "999px",
                    padding: "6px 9px",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    color: "#c85b2e",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div
        style={{
          width: "min(720px, 100%)",
          margin: "24px auto 0",
        }}
      >
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 800,
            letterSpacing: "-.02em",
            margin: "0 0 16px",
          }}
        >
          Reviews
          {ratingData && ratingData.review_count > 0 && (
            <span style={{ fontWeight: 400, fontSize: "1rem", color: "var(--muted)", marginLeft: "8px" }}>
              ({ratingData.review_count})
            </span>
          )}
        </h2>

        {!ratingData || ratingData.recent_reviews.length === 0 ? (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: "14px",
              padding: "32px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <p style={{ margin: 0, fontSize: ".95rem" }}>No reviews yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {ratingData.recent_reviews.map((review) => {
              const reviewerInitials = (
                review.reviewer?.full_name || "E"
              )[0].toUpperCase();
              return (
                <div
                  key={review.id}
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#eef2ff",
                        color: "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: ".9rem",
                        flexShrink: 0,
                      }}
                    >
                      {reviewerInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <strong style={{ fontSize: ".95rem" }}>
                          {review.reviewer?.full_name || "Explorer"}
                        </strong>
                        <small style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                          {new Date(review.created_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </small>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.content && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "var(--muted)",
                            fontSize: ".92rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {review.content}
                        </p>
                      )}
                    </div>
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
