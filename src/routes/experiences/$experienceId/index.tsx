import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { getExperience, deleteExperience } from "~/lib/experiences";
import { parseExperienceContent } from "~/lib/experience-sections";
import { getUserCurrency, formatTierPrice, type CurrencyCode } from "~/lib/currency";

export const Route = createFileRoute("/experiences/$experienceId/")({
  loader: ({ params }) => getExperience({ data: params.experienceId }),
  component: ExperienceDetailPage,
});

function ExperienceDetailPage() {
  const experience = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Currency detection: default to USD for SSR/first paint, then switch to the
  // user's detected currency (₹ for India, $ for everyone else) after mount.
  const [currency, setCurrency] = useState<{ code: CurrencyCode; symbol: string }>(
    { code: "USD", symbol: "$" },
  );
  useEffect(() => {
    setCurrency(getUserCurrency());
  }, []);

  if (experience === undefined) {
    return (
      <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </main>
    );
  }

  if (!experience) {
    return (
      <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "480px", padding: "32px" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>Experience not found</h1>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            This experience may have been removed or the link is incorrect.
          </p>
          <Link to="/" className="btn btn-primary btn-md">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = user?.id === experience.user_id;
  const initials = (experience.profiles?.full_name || "P")[0].toUpperCase();
  const categoryName = experience.categories?.name || "Uncategorized";
  // Structured content: intro + "## Heading" sections (rendered as cards).
  // Legacy content with no headings renders as a single story block.
  const parsed = parseExperienceContent(experience.content);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteExperience({ data: experience.id });
      navigate({ to: "/" });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete experience.");
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const introCard = (body: string) => (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "32px", marginBottom: "16px", whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "1.05rem" }}>
      {body}
    </div>
  );

  return (
    <main style={{ minHeight: "80vh", padding: "48px 16px", background: "var(--bg)" }}>
      <div style={{ width: "min(860px, 100%)", margin: "auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <Link to="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: ".9rem" }}>
            ← Back to experiences
          </Link>
        </div>

        <span style={{ display: "inline-block", background: "#fff1e9", color: "#c85b2e", borderRadius: "999px", padding: "7px 14px", fontSize: ".85rem", fontWeight: 700, marginBottom: "16px" }}>
          {categoryName}
        </span>

        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 24px", lineHeight: 1.2 }}>
          {experience.title}
        </h1>

        <Link to="/profile/$userId" params={{ userId: experience.user_id }} style={{ display: "flex", gap: "12px", alignItems: "center", textDecoration: "none", color: "inherit", marginBottom: "28px", padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fff1e9", color: "#c85b2e", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "1.2rem", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <strong style={{ fontSize: "1rem", display: "block" }}>
              {experience.profiles?.full_name || "PathMate"}
            </strong>
            <small style={{ color: "var(--muted)", fontSize: ".85rem" }}>
              View profile →
            </small>
          </div>
        </Link>

        {parsed.isStructured ? (
          <>
            {parsed.intro && introCard(parsed.intro)}
            {parsed.sections.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                {parsed.sections.map((section) => (
                  <div key={section.heading} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff1e9", color: "#c85b2e", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "1.05rem", flexShrink: 0 }}>
                        {section.icon}
                      </span>
                      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-.01em" }}>
                        {section.heading}
                      </h2>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: ".96rem", color: "var(--text)" }}>
                      {section.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          introCard(experience.content)
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {user ? (
            <Link
              to="/book/$experienceId"
              params={{ experienceId: experience.id }}
              className="btn btn-primary btn-md"
            >
              Book a 30-min call · {formatTierPrice(30, currency)}
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-md"
            >
              Log in to book a call
            </Link>
          )}

          {isOwner && (
            <>
              <Link to="/experiences/$experienceId/edit" params={{ experienceId: experience.id }} className="btn btn-outline btn-md">
                Edit
              </Link>
              <button onClick={() => setShowConfirm(true)} style={{ border: "1px solid #fca5a5", borderRadius: "14px", padding: "14px 24px", fontWeight: 700, background: "transparent", color: "#b42318", cursor: "pointer", fontSize: "inherit", font: "inherit" }}>
                Delete
              </button>
            </>
          )}
        </div>

        <p style={{ color: "var(--muted)", fontSize: ".88rem", marginTop: "14px", lineHeight: 1.5 }}>
          100% refund guarantee — if your PathMate doesn't attend the call, you get a full refund.
        </p>

        {deleteError && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: "#fff0ee", color: "#b42318", fontSize: ".9rem" }}>
            {deleteError}
          </div>
        )}
      </div>

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }} onClick={() => setShowConfirm(false)}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "32px", maxWidth: "440px", width: "100%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.3rem" }}>Delete this experience?</h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>This action cannot be undone. The experience will be permanently removed.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setShowConfirm(false)} disabled={deleting} style={{ border: "1px solid var(--line)", borderRadius: "14px", padding: "12px 18px", fontWeight: 700, background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "inherit", font: "inherit" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ border: "none", borderRadius: "14px", padding: "12px 18px", fontWeight: 700, background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", cursor: deleting ? "not-allowed" : "pointer", fontSize: "inherit", font: "inherit" }}>
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
