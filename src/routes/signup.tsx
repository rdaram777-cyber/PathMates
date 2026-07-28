import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "~/lib/supabase";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error: authError, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() || email.split("@")[0] },
        },
      });

      if (authError) throw authError;

      if (data.user && data.session) {
        // Email confirmation disabled — user is signed in immediately
        navigate({ to: "/" });
      } else {
        setSuccess(
          "Account created! Check your email for a confirmation link if email confirmation is enabled.",
        );
      }
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
          Create your account
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          Create an account to share your experience.
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

        {success && (
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
            {success}
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
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
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

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
            {loading ? "Creating account..." : "Create account"}
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
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
