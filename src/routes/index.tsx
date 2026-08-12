import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth";
import { getExperiences, type ExperienceWithDetails } from "~/lib/experiences";
import { getHomepageStats } from "~/lib/stats";
import { formatTierPriceBoth } from "~/lib/currency";
import { getRecentReviews, type HomepageReview } from "~/lib/reviews";
import { StarRating } from "~/components/StarRating";
import { siteUrl } from "~/lib/site";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [allExperiences, stats, reviews] = await Promise.all([
      getExperiences(),
      getHomepageStats(),
      getRecentReviews(),
    ]);
    // Latest 6 for the featured grid (getExperiences already orders newest first).
    return { experiences: allExperiences.slice(0, 6), stats, reviews };
  },
  head: () => ({
    links: [{ rel: "canonical", href: siteUrl("/") }],
  }),
  component: Home,
});

/** Format counts with thousands separators, e.g. 1234 → "1,234". */
function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

function Home() {
  const { experiences, stats, reviews } = Route.useLoaderData();
  const { user } = useAuth();

  return (
    <main>
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "clamp(64px, 10vw, 112px) 0 clamp(48px, 6vw, 64px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#fff1e9",
              color: "#c85b2e",
              borderRadius: "999px",
              padding: "7px 14px",
              fontSize: ".85rem",
              fontWeight: 700,
              marginBottom: "22px",
            }}
          >
            Real experience. Real people. Real paths.
          </span>
          <h1
            style={{
              maxWidth: "900px",
              margin: "auto",
              fontSize: "clamp(2.5rem, 6.5vw, 5rem)",
              lineHeight: "1.02",
              letterSpacing: "-.055em",
              fontWeight: 800,
            }}
          >
            Learn Directly from People Who Have Already Done It
          </h1>
          <p
            style={{
              maxWidth: "700px",
              margin: "26px auto 0",
              color: "var(--muted)",
              fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)",
              lineHeight: 1.6,
            }}
          >
            Book 1:1 video calls with experienced founders, freelancers,
            creators, and professionals — and get the real story, real numbers,
            and real advice before you take the leap.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "34px",
            }}
          >
            <Link
              to="/search"
              search={{ q: "" }}
              className="btn btn-primary"
            >
              Browse experiences
            </Link>
            <Link
              to="/share"
              className="btn btn-outline"
            >
              Share your experience
            </Link>
          </div>

          {/* Trust line — every claim is true of the live platform */}
          <p
            style={{
              margin: "28px auto 0",
              color: "var(--muted)",
              fontSize: ".95rem",
              fontWeight: 600,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>Secure payments</span>
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>•</span>
            <span>Verified mentors</span>
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>•</span>
            <span>Instant booking confirmation</span>
          </p>

          {/* Secure-payment badges — methods available through Razorpay */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "18px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: ".78rem",
                fontWeight: 700,
                color: "var(--muted)",
                letterSpacing: ".04em",
                textTransform: "uppercase",
              }}
            >
              Secure payment
            </span>
            {["Razorpay", "UPI", "Visa", "Mastercard"].map((method) => (
              <span
                key={method}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: ".78rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  background: "var(--card)",
                  whiteSpace: "nowrap",
                }}
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof stats bar (live counts, never fabricated) */}
      <section style={{ padding: "0 0 clamp(56px, 8vw, 88px)" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            className={`stats-grid${stats.avgRating !== null ? " five" : ""}`}
          >
            <StatCell value={formatCount(stats.mentors)} label="Mentors" />
            <StatCell value={formatCount(stats.experiences)} label="Experiences" />
            <StatCell value={formatCount(stats.bookings)} label="Paid bookings" />
            <StatCell
              value={formatCount(stats.verifiedMentors)}
              label="Verified mentors"
            />
            {stats.avgRating !== null && (
              // Only shown once real ratings exist — never a fake "0.0".
              <StatCell value={stats.avgRating.toFixed(1)} label="Avg. rating" />
            )}
          </div>
        </div>
      </section>

      {/* Featured experiences */}
      <section className="section" id="experiences" style={{ padding: "0 0 80px" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "end",
              marginBottom: "28px",
            }}
            className="heading"
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "#fff1e9",
                  color: "#c85b2e",
                  borderRadius: "999px",
                  padding: "7px 12px",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                Real journeys
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                Featured experiences
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "var(--muted)", margin: 0 }}>
              Real stories, real numbers, real decisions — told by the people
              who lived them. Book a 1:1 call and ask anything.
            </p>
          </div>

          {experiences.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "72px 24px",
                background: "var(--card)",
                border: "1px dashed var(--line)",
                borderRadius: "20px",
              }}
            >
              <div style={{ fontSize: "2.6rem", marginBottom: "12px" }}>🛤️</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.3rem" }}>
                No experiences yet
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  maxWidth: "420px",
                  margin: "0 auto 22px",
                }}
              >
                Be the first to share your journey — the real story, the real
                numbers, the real advice.
              </p>
              <Link
                to="/share"
                className="btn btn-primary btn-md"
              >
                Be the first to share
              </Link>
            </div>
          ) : (
            <div
              className="grid three-col"
            >
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What Explorers say — real reviews from real calls (never fake) */}
      <section
        className="section"
        id="reviews"
        style={{ padding: "70px 0", background: "var(--card)" }}
      >
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "end",
              marginBottom: "28px",
            }}
            className="heading"
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "#fff1e9",
                  color: "#c85b2e",
                  borderRadius: "999px",
                  padding: "7px 12px",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                From the first calls
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                What Explorers say
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "var(--muted)", margin: 0 }}>
              Real reviews from real calls — posted only by Explorers who
              booked and paid.
            </p>
          </div>

          {reviews.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "var(--bg)",
                border: "1px dashed var(--line)",
                borderRadius: "20px",
              }}
            >
              <div style={{ fontSize: "2.6rem", marginBottom: "12px" }}>💬</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.3rem" }}>
                Reviews appear after the first calls
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  maxWidth: "440px",
                  margin: "0 auto",
                }}
              >
                Every review here comes from a paid 1:1 call. Be one of the
                first — book an experience and tell us how it went.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Two paths */}
      <section className="section" id="explore" style={{ padding: "70px 0" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "end",
              marginBottom: "25px",
            }}
            className="heading"
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "#fff1e9",
                  color: "#c85b2e",
                  borderRadius: "999px",
                  padding: "7px 12px",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Choose your path
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                Two ways to use PathMates.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "var(--muted)" }}>
              Search for real experience or share your own journey.
            </p>
          </div>

          <div
            className="grid two-col"
          >
            <div className="card">
              <h3 style={{ margin: "0 0 8px" }}>🎯 I have a goal</h3>
              <p style={{ color: "var(--muted)" }}>
                Find someone who has already walked a similar path.
              </p>
              <a
                href="#experiences"
                className="btn btn-primary btn-sm"
                style={{ marginTop: "16px" }}
              >
                Find my PathMate →
              </a>
            </div>

            <div className="card" id="share-section">
              <h3 style={{ margin: "0 0 8px" }}>🛤️ I&apos;ve been there</h3>
              <p style={{ color: "var(--muted)" }}>
                Share what you learned and help someone else.
              </p>
              <Link
                to="/share"
                className="btn btn-outline btn-sm"
                style={{ marginTop: "16px" }}
              >
                Share my experience →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="section dark"
        id="how"
        style={{
          padding: "70px 0",
          background: "var(--dark)",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "end",
              marginBottom: "25px",
            }}
            className="heading"
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "#fff1e9",
                  color: "#c85b2e",
                  borderRadius: "999px",
                  padding: "7px 12px",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Simple by design
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                From goal to real experience.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "#cbd5df" }}>
              Get practical insight from someone who has actually lived through
              the journey.
            </p>
          </div>

          <div
            className="steps three-col"
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                01
              </div>
              <h3>Tell us your goal</h3>
              <p style={{ color: "#cbd5df" }}>
                Describe what you&apos;re trying to do.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                02
              </div>
              <h3>Find your PathMate</h3>
              <p style={{ color: "#cbd5df" }}>
                Discover someone with relevant experience.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                03
              </div>
              <h3>Learn from the journey</h3>
              <p style={{ color: "#cbd5df" }}>
                Use their experience to make your next step smarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              letterSpacing: "-.03em",
              marginBottom: "12px",
            }}
          >
            Don&apos;t just search for advice. Find someone who&apos;s already
            walked the path.
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your next step could be easier if you learn from someone else&apos;s
            first step.
          </p>
          {user ? (
            <Link
              to="/share"
              className="btn btn-primary btn-md"
            >
              Share your experience
            </Link>
          ) : (
            <Link
              to="/signup"
              className="btn btn-primary btn-md"
            >
              Start exploring experiences
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

/** One cell of the social-proof stats bar. */
function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "26px 18px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
          fontWeight: 800,
          letterSpacing: "-.04em",
          lineHeight: 1.1,
          color: "var(--accent)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: ".76rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".09em",
          color: "var(--muted)",
          marginTop: "8px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Featured experience card: real data only — avatar, verified badge, rating,
 *  price ("From" the cheapest tier, shown in both currencies), duration,
 *  title, category. */
function ExperienceCard({
  experience,
}: {
  experience: ExperienceWithDetails;
}) {
  const profile = experience.profiles;
  const name = profile?.full_name || "PathMate";
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";
  const avatarUrl = profile?.avatar_url ?? null;
  const isVerified = profile?.verified ?? false;
  const avgRating = profile?.avg_rating ?? 0;
  const reviewCount = profile?.review_count ?? 0;
  const categoryName = experience.categories?.name || "Experience";
  const preview =
    experience.content.length > 140
      ? experience.content.slice(0, 140).trimEnd() + "…"
      : experience.content;
  // Cheapest tier (15-min call) as the "From" price — shown in both INR + USD
  // so every visitor sees the full price picture regardless of locale.
  const fromPrice = formatTierPriceBoth(15);

  return (
    <Link
      to="/experiences/$experienceId"
      params={{ experienceId: experience.id }}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        className="card card-hover"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Category */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#f2f4f7",
              borderRadius: "999px",
              padding: "6px 10px",
              fontSize: ".78rem",
              fontWeight: 700,
              color: "#475467",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {categoryName}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: "1.12rem",
            lineHeight: 1.35,
            letterSpacing: "-.01em",
          }}
        >
          {experience.title}
        </h3>

        {/* Content preview */}
        <p
          style={{
            color: "var(--muted)",
            fontSize: ".92rem",
            margin: 0,
            flex: 1,
          }}
        >
          {preview}
        </p>

        {/* Author: avatar / initials + name + verified badge + rating */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderTop: "1px solid var(--line)",
            paddingTop: "14px",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#fff1e9",
                color: "#c85b2e",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: ".85rem",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                flexWrap: "wrap",
              }}
            >
              <strong
                style={{
                  fontSize: ".92rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {name}
              </strong>
              {isVerified && (
                <span
                  title="Verified PathMate"
                  style={{
                    fontSize: ".68rem",
                    background: "#ecfdf3",
                    color: "#067647",
                    borderRadius: "999px",
                    padding: "2px 7px",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  ✓ Verified
                </span>
              )}
            </div>
            {avgRating > 0 ? (
              <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                ★ {avgRating.toFixed(1)}
                {reviewCount > 0 && ` (${reviewCount})`}
              </span>
            ) : (
              <span
                style={{
                  fontSize: ".78rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                New — no ratings yet
              </span>
            )}
          </div>
        </div>

        {/* Price + link — one prominent chip for price & duration */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            borderTop: "1px solid var(--line)",
            paddingTop: "14px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: ".85rem",
              fontWeight: 800,
              letterSpacing: "-.01em",
              whiteSpace: "nowrap",
            }}
          >
            {`From ${fromPrice} · 15–60 min calls`}
          </span>
          <span
            style={{
              fontSize: ".85rem",
              fontWeight: 700,
              color: "var(--accent)",
              whiteSpace: "nowrap",
            }}
          >
            View experience →
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Testimonial card — real review data only (no fabricated content). */
function ReviewCard({ review }: { review: HomepageReview }) {
  const name = review.reviewerName || "Explorer";
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "E";
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: "18px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <StarRating rating={review.rating} size="sm" />
        <span style={{ fontSize: ".75rem", color: "var(--muted)", fontWeight: 600 }}>
          {new Date(review.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      {review.content && (
        <p style={{ margin: 0, fontSize: ".95rem", lineHeight: 1.6, flex: 1 }}>
          {review.content}
        </p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderTop: "1px solid var(--line)",
          paddingTop: "14px",
        }}
      >
        {review.reviewerAvatar ? (
          <img
            src={review.reviewerAvatar}
            alt={name}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#fff1e9",
              color: "#c85b2e",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: ".82rem",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontSize: ".92rem", display: "block" }}>
            {name}
          </strong>
          {review.experienceTitle && (
            <span
              style={{
                fontSize: ".8rem",
                color: "var(--muted)",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {review.experienceTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
