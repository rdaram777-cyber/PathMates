import { createFileRoute, Link } from "@tanstack/react-router";
import { formatTierPrice, type CurrencyCode } from "~/lib/currency";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — PathMates" },
      {
        name: "description",
        content:
          "PathMates is a marketplace where real people share their real journeys — the startup cost, the timeline, the income, the mistakes — and you book 1:1 video calls with the person who lived it.",
      },
    ],
  }),
  component: AboutPage,
});

// Fixed display pair for the static "from" price shown on this page. Both
// currencies are shown (INR + USD) so the price is honest for every visitor
// without needing client-side currency detection.
const INR: { code: CurrencyCode; symbol: string } = { code: "INR", symbol: "₹" };
const USD: { code: CurrencyCode; symbol: string } = { code: "USD", symbol: "$" };
const fromInr = formatTierPrice(15, INR);
const fromUsd = formatTierPrice(15, USD);

function AboutPage() {
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
            Our story
          </span>
          <h1
            style={{
              maxWidth: "820px",
              margin: "auto",
              fontSize: "clamp(2.5rem, 6.5vw, 4.6rem)",
              lineHeight: "1.02",
              letterSpacing: "-.055em",
              fontWeight: 800,
            }}
          >
            Real journeys. Real people. Real paths.
          </h1>
          <p
            style={{
              maxWidth: "680px",
              margin: "26px auto 0",
              color: "var(--muted)",
              fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)",
              lineHeight: 1.6,
            }}
          >
            PathMates exists so you can learn from someone who has actually done
            what you&apos;re trying to do — not from articles, not from
            highlight reels, but from a real person with real numbers.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="section" style={{ padding: "0 0 80px" }}>
        <div
          style={{
            width: "min(860px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            className="card"
            style={{
              padding: "clamp(28px, 5vw, 52px)",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "#fff1e9",
                color: "#c85b2e",
                borderRadius: "999px",
                padding: "7px 12px",
                fontSize: ".85rem",
                fontWeight: 700,
                marginBottom: "18px",
              }}
            >
              From the founder
            </span>
            <h2
              style={{
                fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
                letterSpacing: "-.045em",
                margin: "0 0 20px",
              }}
            >
              Why I built PathMates
            </h2>
            <div style={{ fontSize: "1.05rem", lineHeight: 1.75, color: "var(--text)" }}>
              <p style={{ margin: "0 0 18px" }}>
                PathMates started with a simple frustration: when I was getting
                ready to start my own small business, I could read a thousand
                articles and watch a hundred videos — but what I really wanted
                was to sit down with someone who had actually done it. Someone
                who could tell me what the first month really costs, where the
                money actually goes, and which mistakes I could simply skip.
              </p>
              <p style={{ margin: "0 0 18px" }}>
                That person is hard to find. Search engines give you theory.
                Social media gives you highlights. Nobody gives you the messy,
                honest, numbers-included reality — or the chance to ask your own
                questions and get a straight answer from lived experience.
              </p>
              <p style={{ margin: "0 0 18px" }}>
                So I built PathMates: a marketplace where people who have
                already done it share their real journey — the startup cost, the
                timeline, the income, the mistakes — and where you can book a
                1:1 video call with them and get advice that&apos;s specific to
                YOUR situation.
              </p>
              <p style={{ margin: 0 }}>
                Every story on PathMates is from a real person with real
                numbers. Every call comes with a 100% refund guarantee if the
                mentor doesn&apos;t attend. We&apos;re building the marketplace I
                wish had existed when I was starting out.
              </p>
            </div>
            <div
              style={{
                marginTop: "26px",
                paddingTop: "20px",
                borderTop: "1px solid var(--line)",
                color: "var(--muted)",
                fontWeight: 600,
                fontSize: ".92rem",
              }}
            >
              — The PathMates founder
            </div>
          </div>
        </div>
      </section>

      {/* What is PathMates? */}
      <section className="section" style={{ padding: "0 0 80px" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "18px",
            }}
            className="grid two-col"
          >
            <div className="card">
              <h3 style={{ margin: "0 0 8px" }}>📚 What is PathMates?</h3>
              <p style={{ color: "var(--muted)", margin: "0 0 12px" }}>
                A marketplace where people share real experience stories and
                Explorers book 1:1 video calls with the person who lived them.
              </p>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Instead of generic advice, you get a firsthand account: what it
                really cost, how long it really took, what actually worked — and
                the mistakes you can skip.
              </p>
            </div>
            <div className="card">
              <h3 style={{ margin: "0 0 8px" }}>🎯 What you get</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Detailed experience stories with real numbers — startup cost,
                timeline, income, mistakes — plus the chance to ask your own
                questions in a live 1:1 call and get answers specific to your
                situation.
              </p>
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
                How it works.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "#cbd5df" }}>
              From a real story to a real conversation in three steps.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
            className="steps three-col"
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>🔍</div>
              <h3 style={{ margin: "0 0 6px" }}>Browse a story</h3>
              <p style={{ color: "#cbd5df", margin: 0 }}>
                Read a real experience — the numbers, the timeline, the
                mistakes — from someone who&apos;s been there.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>📅</div>
              <h3 style={{ margin: "0 0 6px" }}>Book a 1:1 call</h3>
              <p style={{ color: "#cbd5df", margin: 0 }}>
                Pick a 15, 30, 45 or 60-minute slot and pay securely — from{" "}
                {fromInr} / {fromUsd} for 15 minutes.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>💬</div>
              <h3 style={{ margin: "0 0 6px" }}>Get answers specific to you</h3>
              <p style={{ color: "#cbd5df", margin: 0 }}>
                Talk live with the person who lived it and get advice tailored
                to your situation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section className="section" style={{ padding: "80px 0" }}>
        <div
          style={{
            width: "min(1160px, calc(100% - 32px))",
            margin: "auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "28px",
            }}
          >
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
              Built on trust
            </span>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                letterSpacing: "-.05em",
                margin: 0,
              }}
            >
              Your call, guaranteed.
              <br />
              Your payment, protected.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
            className="grid three-col"
          >
            <div className="card">
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>🔒</div>
              <h3 style={{ margin: "0 0 6px" }}>100% refund guarantee</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                If your PathMate doesn&apos;t attend the call, you get a full
                refund. No questions asked.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>🛡️</div>
              <h3 style={{ margin: "0 0 6px" }}>Secure payments via Razorpay</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Payments are processed by Razorpay with UPI, Visa and
                Mastercard. We never see or store your card details.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>✓</div>
              <h3 style={{ margin: "0 0 6px" }}>Verified mentors</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                PathMates we&apos;ve confirmed carry a verified badge, so you
                know exactly who you&apos;re learning from.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 90px", textAlign: "center" }}>
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
            Ready to learn from someone who&apos;s been there?
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Find a real story, or share the one only you can tell.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/search"
              search={{ q: "" }}
              style={{
                border: "none",
                borderRadius: "14px",
                padding: "15px 26px",
                fontWeight: 700,
                fontSize: "1rem",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                display: "inline-block",
                boxShadow: "0 8px 24px rgba(233,121,69,.28)",
              }}
            >
              Browse experiences
            </Link>
            <Link
              to="/share"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "15px 26px",
                fontWeight: 700,
                fontSize: "1rem",
                background: "transparent",
                color: "var(--text)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Share your experience
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
