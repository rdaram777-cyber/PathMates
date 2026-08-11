import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "~/lib/auth";
import { createExperience, getCategories, type Category } from "~/lib/experiences";
import {
  EXPERIENCE_SECTIONS,
  buildExperienceContent,
  emptySectionFields,
} from "~/lib/experience-sections";

export const Route = createFileRoute("/share")({
  loader: () => getCategories(),
  component: SharePage,
});

function SharePage() {
  const categories = Route.useLoaderData() as Category[];
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [sections, setSections] = useState<Record<string, string>>(emptySectionFields());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to signup if not logged in
  if (!user) {
    return (
      <main
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "480px",
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>
            Log in to share your experience
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
            Create an account or log in to share what you&apos;ve learned with the
            PathMates community.
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <Link
              to="/login"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "12px 18px",
                fontWeight: 700,
                background: "transparent",
                color: "var(--text)",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px 18px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Build the structured content from the intro + optional section fields.
      const built = buildExperienceContent(content, sections);
      const result = await createExperience({
        data: {
          title: title.trim(),
          content: built,
          category_id: categoryId || null,
        },
      });

      setTitle("");
      setCategoryId("");
      setContent("");
      setSections(emptySectionFields());
      setLoading(false);

      // Redirect to the new experience detail page
      navigate({
        to: "/experiences/$experienceId",
        params: { experienceId: result.id },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setLoading(false);
    }
  }

  const textareaStyle: CSSProperties = {
    width: "100%",
    border: "1px solid var(--line)",
    borderRadius: "10px",
    padding: "12px",
    outline: "none",
    fontSize: "inherit",
    font: "inherit",
    background: "var(--bg)",
    resize: "vertical",
    minHeight: "70px",
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
          width: "min(680px, 100%)",
          margin: "auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "20px",
          padding: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            margin: "0 0 4px",
            letterSpacing: "-.03em",
          }}
        >
          Share your experience
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          Help someone who is where you once were.
        </p>

        {error && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#fff0ee",
              color: "#b42318",
              marginBottom: "16px",
              fontSize: ".9rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="I started a business from scratch"
              style={{
                width: "100%",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "12px",
                outline: "none",
                fontSize: "inherit",
                font: "inherit",
                background: "var(--bg)",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              style={{
                width: "100%",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "12px",
                outline: "none",
                fontSize: "inherit",
                font: "inherit",
                background: "var(--bg)",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Your experience
            </label>
            <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: ".85rem" }}>
              Write your story here. Anything before the section headings below.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              style={{
                width: "100%",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "12px",
                outline: "none",
                fontSize: "inherit",
                font: "inherit",
                background: "var(--bg)",
                resize: "vertical",
                minHeight: "150px",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 4px" }}>
              Optional details
            </h2>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "0 0 16px" }}>
              Fill in any that apply — they&apos;ll be shown as clear sections on your
              experience page.
            </p>
            {EXPERIENCE_SECTIONS.map((section) => (
              <div key={section.key} style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    marginBottom: "6px",
                    fontSize: ".95rem",
                  }}
                >
                  <span style={{ marginRight: "6px" }}>{section.icon}</span>
                  {section.heading}
                </label>
                <textarea
                  value={sections[section.key] ?? ""}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      [section.key]: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder={section.hint}
                  style={textareaStyle}
                />
              </div>
            ))}
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
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
                fontSize: "inherit",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px 18px",
                fontWeight: 700,
                background: loading ? "#ccc" : "var(--accent)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "inherit",
                font: "inherit",
              }}
            >
              {loading ? "Publishing..." : "Publish experience"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
