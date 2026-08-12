import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TIER_DURATIONS,
  formatTierPrice,
  type CurrencyCode,
} from "~/lib/currency";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — PathMates" },
      {
        name: "description",
        content:
          "Answers about how PathMates works: booking 1:1 video calls with real people, call costs, the 100% refund guarantee, becoming a PathMate, and secure payments via Razorpay.",
      },
    ],
  }),
  component: FaqPage,
});

// Static display pair for the pricing table — both currencies are shown
// (INR + USD) so the tiers are honest for every visitor without needing
// client-side currency detection.
const INR: { code: CurrencyCode; symbol: string } = { code: "INR", symbol: "₹" };
const USD: { code: CurrencyCode; symbol: string } = { code: "USD", symbol: "$" };

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How does PathMates work?",
    a: "Explorers read real experience stories — the startup cost, the timeline, the income, the mistakes — and book 1:1 video calls with the person who lived them. You browse, you pick someone whose journey matches your goal, and you ask anything.",
  },
  {
    q: "What happens after I book a call?",
    a: "Payment is processed securely via Razorpay. Once it goes through, your booking is confirmed and your call link appears in My Bookings, ready for your scheduled time.",
  },
  {
    q: "What if my PathMate doesn't attend?",
    a: "You're covered by our 100% refund guarantee: if your PathMate doesn't attend the call, you get a full refund. No questions asked.",
  },
  {
    q: "What does a call cost?",
    a: "Calls are available in 15, 30, 45 and 60-minute tiers. Indian users pay in ₹ (INR); everyone else pays in $ (USD).",
  },
  {
    q: "How do I become a PathMate?",
    a: "Share your experience from the Share page and start accepting bookings. Once your story is live, Explorers can find it, read it, and book 1:1 calls with you.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. Payments are processed by Razorpay with UPI, Visa and Mastercard. We never see or store your card details — card information goes directly to Razorpay's secure checkout.",
  },
  {
    q: "Who verifies the PathMates?",
    a: "Verified badges mark mentors we've confirmed. Verification is an extra trust signal — every story on PathMates is from a real person with real numbers.",
  },
  {
    q: "How do I get my call link?",
    a: "Your call link appears in My Bookings as soon as your booking is confirmed. Open My Bookings any time to see your upcoming calls and their links.",
  },
];

function FaqPage() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "clamp(64px, 10vw, 104px) 0 clamp(40px, 5vw, 56px)",
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
            Help center
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
            Frequently asked questions
          </h1>
          <p
            style={{
              maxWidth: "640px",
              margin: "22px auto 0",
              color: "var(--muted)",
              fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)",
              lineHeight: 1.6,
            }}
          >
            Everything you need to know before your first call. Can&apos;t find
            your answer? Browse experiences and ask a PathMate directly.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section style={{ padding: "0 0 80px" }}>
        <div
          style={{
            width: "min(760px, calc(100% - 32px))",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                <span>{item.q}</span>
                <span className="faq-chevron" aria-hidden="true">
                  ▾
                </span>
              </summary>
              <div className="faq-body">{item.a}</div>
            </details>
          ))}

          {/* Pricing table (tiers from src/lib/currency.ts) */}
          <details className="faq-item" open={false}>
            <summary>
              <span>Pricing at a glance</span>
              <span className="faq-chevron" aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className="faq-body">
              <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>
                Flat rates for every PathMate — no surprises:
              </p>
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {TIER_DURATIONS.map((duration, i) => (
                  <div
                    key={duration}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 16px",
                      background: i % 2 === 0 ? "var(--bg)" : "var(--card)",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: ".95rem" }}>
                      {duration}-minute call
                    </span>
                    <span style={{ fontWeight: 800, fontSize: ".95rem" }}>
                      {formatTierPrice(duration, INR)} /{" "}
                      {formatTierPrice(duration, USD)}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: ".88rem" }}>
                Indian users pay in ₹ (INR); everyone else pays in $ (USD).
              </p>
            </div>
          </details>
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
            Still curious?
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            The fastest way to get an answer is from someone who&apos;s been
            there.
          </p>
          <Link
            to="/search"
            search={{ q: "" }}
            className="btn btn-primary"
          >
            Browse experiences
          </Link>
        </div>
      </section>
    </main>
  );
}
