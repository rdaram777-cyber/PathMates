import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "~/lib/supabase";

export const resendVerificationEmail = createServerFn({ method: "POST" }).handler(
  async () => {
    // This is a client-side operation via Supabase
    // We re-export this as a server fn for consistency
    return { success: true };
  },
);

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const handleResend = async () => {
    // Use supabase directly since we're on client
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email ?? "";
      if (!email) {
        alert("Could not determine your email. Please log in and try again.");
        return;
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        alert("Could not resend. Please try again.");
      } else {
        alert("Verification email resent! Check your inbox.");
      }
    } catch {
      alert("Could not resend. Please try again.");
    }
  };

  return (
    <main
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Email icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#fff1e9",
            color: "var(--accent)",
            display: "grid",
            placeItems: "center",
            fontSize: "2.5rem",
            margin: "0 auto 24px",
          }}
        >
          ✉️
        </div>

        <h1
          style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-.03em",
            margin: "0 0 12px",
          }}
        >
          Check your email
        </h1>

        <p style={{ color: "var(--muted)", marginBottom: "8px", fontSize: "1.05rem" }}>
          We&apos;ve sent a verification link to your email address.
        </p>

        <p style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "0.95rem" }}>
          Click the link in the email to verify your account and unlock all
          features. If you don&apos;t see it, check your spam folder.
        </p>

        <div
          className="card"
          style={{
            padding: "24px",
            textAlign: "left",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
            What happens next?
          </h3>
          <ul
            style={{
              color: "var(--muted)",
              fontSize: ".92rem",
              paddingLeft: "20px",
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <li>Open the email from PathMates</li>
            <li>Click the verification link</li>
            <li>You&apos;ll be redirected back to PathMates — fully verified!</li>
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleResend}
            style={{
              border: "1px solid var(--line)",
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: 700,
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              font: "inherit",
              fontSize: ".95rem",
            }}
          >
            Resend verification email
          </button>

          <Link
            to="/"
            style={{
              color: "var(--accent)",
              textDecoration: "none",
              fontSize: ".92rem",
              fontWeight: 600,
            }}
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
