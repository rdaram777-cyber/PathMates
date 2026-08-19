import type { ReactNode } from "react";
import type { LegalDoc } from "~/lib/legal";

/**
 * Shared layout for the Privacy Policy and Terms & Conditions pages.
 * Mirrors the about/faq page structure: centered hero with badge pill +
 * heading, then a max-width content column of subtle cards.
 */

/** Renders a text node, converting `**bold**` markers to <strong>. */
function renderInline(text: string): ReactNode {
  const parts = text.split("**");
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
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
            {doc.badge}
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
            {doc.heading}
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
            {doc.intro}
          </p>
          <p
            style={{
              margin: "14px auto 0",
              color: "var(--muted)",
              fontSize: ".9rem",
              fontWeight: 600,
            }}
          >
            {doc.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: "0 0 90px" }}>
        <div
          style={{
            width: "min(820px, calc(100% - 32px))",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {doc.sections.map((section) => (
            <div
              key={section.heading}
              className="card"
              style={{
                padding: "clamp(24px, 4vw, 34px)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  letterSpacing: "-.02em",
                  margin: "0 0 12px",
                }}
              >
                {section.heading}
              </h2>
              {section.paragraphs?.map((p, i) => (
                <p
                  key={i}
                  style={{
                    color: "var(--text)",
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    margin: i === 0 ? 0 : "12px 0 0",
                  }}
                >
                  {renderInline(p)}
                </p>
              ))}
              {section.bullets && (
                <ul
                  style={{
                    margin: section.paragraphs?.length ? "12px 0 0" : 0,
                    paddingLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {section.bullets.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        color: "var(--text)",
                        fontSize: "1rem",
                        lineHeight: 1.65,
                      }}
                    >
                      {renderInline(b)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
