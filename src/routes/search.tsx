import { createFileRoute, Link } from "@tanstack/react-router";
import { searchExperiences, type ExperienceWithDetails } from "~/lib/experiences";
import { StarRatingInline } from "~/components/StarRating";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, string>) => {
    return { q: search.q || "" };
  },
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => {
    if (!deps.q.trim()) return { query: "", results: [] as ExperienceWithDetails[] };
    return searchExperiences({ data: deps.q }).then((results) => ({
      query: deps.q,
      results,
    }));
  },
  component: SearchPage,
});

function SearchPage() {
  const { query, results } = Route.useLoaderData() as {
    query: string;
    results: ExperienceWithDetails[];
  };

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
          width: "min(1160px, calc(100% - 32px))",
          margin: "auto",
        }}
      >
        {/* Search heading */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            to="/"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: ".9rem",
              display: "inline-block",
              marginBottom: "12px",
            }}
          >
            ← Back to home
          </Link>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 800,
              letterSpacing: "-.03em",
              margin: "0 0 4px",
            }}
          >
            {query ? (
              <>
                {results.length} matching experience
                {results.length !== 1 ? "s" : ""}
              </>
            ) : (
              "Search experiences"
            )}
          </h1>
          {query && (
            <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
              Showing results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Search form (for re-search) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.querySelector("input")!;
            if (input.value.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
            }
          }}
          className="search-box"
          style={{ marginBottom: "40px" }}
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="What do you want to do? e.g. start a business"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "14px",
              background: "transparent",
              minWidth: 0,
              fontSize: "inherit",
              font: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "14px 18px",
              fontWeight: 700,
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "inherit",
              font: "inherit",
            }}
          >
            Search
          </button>
        </form>

        {/* Results */}
        {!query ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--muted)",
            }}
          >
            <p style={{ fontSize: "1.1rem" }}>
              Enter a search term to find experiences.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--muted)",
            }}
          >
            <p style={{ fontSize: "1.1rem", marginBottom: "12px" }}>
              No matching experiences found.
            </p>
            <p style={{ fontSize: ".95rem" }}>
              Try a different search term or{" "}
              <Link
                to="/share"
                style={{ color: "var(--accent)", fontWeight: 600 }}
              >
                share your own experience
              </Link>
              .
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
            className="grid three-col"
          >
            {results.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/** Reusable experience card (same as homepage) */
function ExperienceCard({
  experience,
}: {
  experience: ExperienceWithDetails;
}) {
  const isDemo = experience.id.startsWith("demo");
  const preview =
    experience.content.length > 150
      ? experience.content.slice(0, 150) + "..."
      : experience.content;
  const initials = (experience.profiles?.full_name || "P")[0].toUpperCase();
  const categoryName = experience.categories?.name || "Experience";
  const avgRating = experience.profiles?.avg_rating ?? 0;
  const reviewCount = experience.profiles?.review_count ?? 0;
  const isVerified = experience.profiles?.verified ?? false;

  return (
    <div className="card">
      {/* Category tag */}
      <span
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
        {categoryName}
      </span>

      {/* Title */}
      <h3 style={{ margin: "8px 0 12px", fontSize: "1.05rem" }}>
        {experience.title}
      </h3>

      {/* Content preview */}
      <p
        style={{
          color: "var(--muted)",
          whiteSpace: "pre-wrap",
          fontSize: ".92rem",
        }}
      >
        {preview}
      </p>

      {/* Author + link */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          borderTop: "1px solid var(--line)",
          paddingTop: "15px",
          marginTop: "16px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#fff1e9",
              color: "#c85b2e",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <strong style={{ fontSize: ".95rem" }}>
                {experience.profiles?.full_name || "PathMate"}
              </strong>
              {isVerified && (
                <span
                  style={{
                    fontSize: ".7rem",
                    background: "#ecfdf3",
                    color: "#067647",
                    borderRadius: "999px",
                    padding: "2px 6px",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            <StarRatingInline rating={avgRating} count={reviewCount} />
          </div>
        </div>

        {!isDemo && (
          <Link
            to="/experiences/$experienceId"
            params={{ experienceId: experience.id }}
            style={{
              fontSize: ".82rem",
              fontWeight: 700,
              color: "var(--accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View experience →
          </Link>
        )}
      </div>
    </div>
  );
}
