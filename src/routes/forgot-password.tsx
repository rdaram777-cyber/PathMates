import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/login`,
        },
      );

      if (resetError) throw resetError;

      setMessage(
        "If an account with that email exists, a password reset link has been sent.",
      );
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          width: "min(440px, 100%)",
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
          Reset your password
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          Enter your email and we&apos;ll send you a reset link.
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
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontWeight: 700,
              background: loading ? "#ccc" : "var(--accent)",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "inherit",
              font: "inherit",
            }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: ".9rem",
          }}
        >
          <Link
            to="/login"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Back to log in
          </Link>
        </div>
      </div>
    </main>
  );
}
