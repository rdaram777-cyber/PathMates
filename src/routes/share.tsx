import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";

const createExperience = createServerFn({ method: "POST" })
  .validator(
    (data: { title: string; content: string; categorySlug: string }) => data,
  )
  .handler(async ({ data }) => {
    const { createSupabaseClient } = await import("~/db");

    const sb = createSupabaseClient();

    // Get user from session (server-side)
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to share an experience.");
    }

    // Find category by slug
    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: category } = await sb
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug.toLowerCase())
        .single();

      categoryId = category?.id ?? null;
    }

    const { error } = await sb.from("experiences").insert({
      user_id: user.id,
      title: data.title,
      content: data.content,
      category_id: categoryId,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  });

export const Route = createFileRoute("/share")({
  component: SharePage,
});

function SharePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <a
              href="/login"
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
            </a>
            <a
              href="/signup"
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
            </a>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await createExperience({
        title: title.trim(),
        content: content.trim(),
        categorySlug: category.trim(),
      });

      setMessage("Experience published successfully.");
      setTitle("");
      setCategory("");
      setContent("");

      setTimeout(() => {
        navigate({ to: "/" });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

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
          width: "min(620px, 100%)",
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

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#ecfdf3",
              color: "#16803c",
              marginBottom: "16px",
              fontSize: ".9rem",
            }}
          >
            {message}
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
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="Business, Career, Relocation"
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "12px 18px",
                fontWeight: 700,
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "inherit",
                font: "inherit",
              }}
            >
              Cancel
            </button>
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
