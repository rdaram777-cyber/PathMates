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
  const [verificationSent, setVerificationSent] = useState(false);

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
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (data.user && data.session) {
        // Email confirmation is disabled on Supabase side — signed in immediately
        navigate({ to: "/" });
      } else if (data.user && !data.session) {
        // Email confirmation is required — user needs to verify
        setVerificationSent(true);
        setSuccess(
          "Account created! Check your email to verify your account.",
        );
      } else {
        setVerificationSent(true);
        setSuccess(
          "Account created! Check your email for a confirmation link.",
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

  async function handleResend() {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) throw error;
      setSuccess("Verification email resent! Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend verification.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (verificationSent) {
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
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✉️</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              margin: "0 0 8px",
              letterSpacing: "-.03em",
            }}
          >
            Check your email
          </h1>
          <p style={{ color: "var(--muted)", margin: "0 0 8px", fontSize: ".95rem" }}>
            We&apos;ve sent a verification link to <strong>{email}</strong>.
          </p>
          <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: ".9rem" }}>
            Click the link in the email to verify your account. If you
            don&apos;t see it, check your spam folder.
          </p>

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

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "12px",
                fontWeight: 700,
                background: "transparent",
                color: "var(--text)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "inherit",
                font: "inherit",
              }}
            >
              {loading ? "Sending..." : "Resend verification email"}
            </button>
            <Link
              to="/login"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontSize: ".9rem",
              }}
            >
              Already verified? Log in
            </Link>
          </div>
        </div>
      </main>
    );
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
                color: "var(--text)",
                boxSizing: "border-box",
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
                color: "var(--text)",
                boxSizing: "border-box",
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
                color: "var(--text)",
                boxSizing: "border-box",
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
