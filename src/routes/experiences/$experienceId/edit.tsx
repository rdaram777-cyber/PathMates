import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type CSSProperties } from "react";
import type { FormEvent } from "react";
import { useAuth } from "~/lib/auth";
import { getExperience, updateExperience, getCategories, type Category, type ExperienceWithDetails } from "~/lib/experiences";
import {
  EXPERIENCE_SECTIONS,
  buildExperienceContent,
  emptySectionFields,
  sectionFieldsFromContent,
} from "~/lib/experience-sections";

export const Route = createFileRoute("/experiences/$experienceId/edit")({
  loader: async ({ params }) => {
    const [experience, categories] = await Promise.all([
      getExperience({ data: params.experienceId }),
      getCategories(),
    ]);
    return { experience, categories };
  },
  component: EditExperiencePage,
});

function EditExperiencePage() {
  const { experience, categories } = Route.useLoaderData() as {
    experience: ExperienceWithDetails | null;
    categories: Category[];
  };
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sections, setSections] = useState<Record<string, string>>(emptySectionFields());
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (experience) {
      setTitle(experience.title);
      setContent(experience.content);
      setCategoryId(experience.category_id ?? "");
      // Mirror the parser: split stored content back into the intro field
      // (main textarea) plus the six canonical section fields.
      const parsed = sectionFieldsFromContent(experience.content);
      setContent(parsed.intro);
      setSections(parsed.fields);
    }
  }, [experience]);

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
          <Link to="/" style={{ display: "inline-block", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, background: "var(--accent)", color: "#fff", textDecoration: "none" }}>
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "40px", maxWidth: "480px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>Log in to edit</h2>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>You need to be logged in to edit this experience.</p>
          <Link to="/login" style={{ display: "inline-block", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, background: "var(--accent)", color: "#fff", textDecoration: "none" }}>
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (user.id !== experience.user_id) {
    return (
      <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "40px", maxWidth: "480px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>Not authorized</h2>
          <p style={{ color: "var(--muted)", marginBottom: "20px" }}>You can only edit your own experiences.</p>
          <Link to="/experiences/$experienceId" params={{ experienceId: experience.id }} style={{ display: "inline-block", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, background: "var(--accent)", color: "#fff", textDecoration: "none" }}>
            Back to experience
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Rebuild the structured content from the intro + section fields.
      const built = buildExperienceContent(content, sections);
      await updateExperience({ data: { id: experience!.id, title: title.trim(), content: built, category_id: categoryId || null } });
      navigate({ to: "/experiences/$experienceId", params: { experienceId: experience!.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
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
    <main style={{ minHeight: "80vh", padding: "48px 16px", background: "var(--bg)" }}>
      <div style={{ width: "min(680px, 100%)", margin: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "32px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-.03em" }}>Edit experience</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>Update your shared experience.</p>

        {error && (
          <div style={{ padding: "12px", borderRadius: "10px", background: "#fff0ee", color: "#b42318", marginBottom: "16px", fontSize: ".9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="I started a business from scratch"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", outline: "none", fontSize: "inherit", font: "inherit", background: "var(--bg)" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", outline: "none", fontSize: "inherit", font: "inherit", background: "var(--bg)", cursor: "pointer" }}>
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Your experience</label>
            <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: ".85rem" }}>
              Write your story here. Anything before the section headings below.
            </p>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={6}
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", outline: "none", fontSize: "inherit", font: "inherit", background: "var(--bg)", resize: "vertical", minHeight: "150px" }} />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 4px" }}>Optional details</h2>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "0 0 16px" }}>
              Fill in any that apply — they'll be shown as clear sections on your experience page.
            </p>
            {EXPERIENCE_SECTIONS.map((section) => (
              <div key={section.key} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px", fontSize: ".95rem" }}>
                  <span style={{ marginRight: "6px" }}>{section.icon}</span>
                  {section.heading}
                </label>
                <textarea
                  value={sections[section.key] ?? ""}
                  onChange={(e) => setSections((prev) => ({ ...prev, [section.key]: e.target.value }))}
                  rows={3}
                  placeholder={section.hint}
                  style={textareaStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Link to="/experiences/$experienceId" params={{ experienceId: experience.id }}
              style={{ border: "1px solid var(--line)", borderRadius: "12px", padding: "12px 18px", fontWeight: 700, background: "transparent", color: "var(--text)", textDecoration: "none", fontSize: "inherit", display: "inline-flex", alignItems: "center" }}>
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              style={{ border: "none", borderRadius: "12px", padding: "12px 18px", fontWeight: 700, background: loading ? "#ccc" : "var(--accent)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "inherit", font: "inherit" }}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
