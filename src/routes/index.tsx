import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAuth } from "~/lib/auth";
import { createSupabaseClient } from "~/db";
import type { Database } from "~/lib/database.types";

type Experience = Database["public"]["Tables"]["experiences"]["Row"] & {
  profiles?: { full_name: string | null } | null;
  categories?: { name: string | null } | null;
};

const getExperiences = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createSupabaseClient();
  const { data, error } = await sb
    .from("experiences")
    .select("*, profiles(full_name), categories(name)")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    // If table doesn't exist yet, return empty
    return [] as Experience[];
  }

  return (data as Experience[]) ?? [];
});

export const Route = createFileRoute("/")({
  loader: () => getExperiences(),
  component: Home,
});

function Home() {
  const experiences = Route.useLoaderData() as Experience[];
  const { user } = useAuth();

  // Demo data fallback if no experiences in DB yet
  const demos: Experience[] = [
    {
      id: "demo1",
      user_id: "",
      title: "I have experience in business and can share my experience.",
      content:
        "I can share what I learned, what worked and what I would do differently.",
      category_id: null,
      created_at: "",
      updated_at: "",
      profiles: { full_name: "PathMate" },
      categories: { name: "Business" },
    },
    {
      id: "demo2",
      user_id: "",
      title: "Moved to another country and found a new career.",
      content:
        "I can share my real experience with relocation, applications and starting again.",
      category_id: null,
      created_at: "",
      updated_at: "",
      profiles: { full_name: "PathMate" },
      categories: { name: "Career" },
    },
    {
      id: "demo3",
      user_id: "",
      title: "Started a project from scratch.",
      content:
        "Here is what I learned from the first idea to the first result.",
      category_id: null,
      created_at: "",
      updated_at: "",
      profiles: { full_name: "PathMate" },
      categories: { name: "Projects" },
    },
  ];

  const displayExperiences =
    experiences.length > 0 ? experiences : demos;

  return (
    <main>
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 0 55px",
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
              padding: "7px 12px",
              fontSize: ".85rem",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            Real experience. Real people. Real paths.
          </span>
          <h1
            style={{
              maxWidth: "820px",
              margin: "auto",
              fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
              lineHeight: ".98",
              letterSpacing: "-.07em",
            }}
          >
            You have a goal. Someone has already done it.
          </h1>
          <p
            style={{
              maxWidth: "650px",
              margin: "24px auto",
              color: "var(--muted)",
              fontSize: "1.1rem",
            }}
          >
            Find people who have actually lived through the experience
            you&apos;re considering.
          </p>

          <div
            style={{
              maxWidth: "720px",
              margin: "25px auto 0",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "18px",
              padding: "8px",
              display: "flex",
            }}
            className="search-box"
          >
            <input
              placeholder="What do you want to do? e.g. start a business"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "14px",
                background: "transparent",
                minWidth: 0,
                fontSize: "inherit",
                font: "inherit",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const el = document.getElementById("explore");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />
            <a
              href="#explore"
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "14px 18px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
            >
              Find someone
            </a>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="section" id="explore" style={{ padding: "70px 0" }}>
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
                Choose your path
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                Two ways to use PathMates.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "var(--muted)" }}>
              Search for real experience or share your own journey.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "18px",
            }}
            className="grid two-col"
          >
            <div className="card">
              <h3 style={{ margin: "0 0 8px" }}>🎯 I have a goal</h3>
              <p style={{ color: "var(--muted)" }}>
                Find someone who has already walked a similar path.
              </p>
              <a
                href="#experiences"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontWeight: 700,
                  background: "var(--accent)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Find my PathMate →
              </a>
            </div>

            <div className="card" id="share-section">
              <h3 style={{ margin: "0 0 8px" }}>🛤️ I&apos;ve been there</h3>
              <p style={{ color: "var(--muted)" }}>
                Share what you learned and help someone else.
              </p>
              <Link
                to="/share"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontWeight: 700,
                  background: "transparent",
                  color: "var(--text)",
                  textDecoration: "none",
                }}
              >
                Share my experience →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured experiences */}
      <section className="section" id="experiences" style={{ padding: "70px 0" }}>
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
                Real journeys
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "-.05em",
                  margin: 0,
                }}
              >
                Explore experiences.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "var(--muted)" }}>
              Specific experiences from people who have walked the path.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
            className="grid three-col"
          >
            {displayExperiences.map((exp) => (
              <div className="card" key={exp.id}>
                <span
                  style={{
                    display: "inline-block",
                    background: "#f2f4f7",
                    borderRadius: "999px",
                    padding: "6px 9px",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    color: "#475467",
                  }}
                >
                  {exp.categories?.name || "Experience"}
                </span>
                <h3 style={{ margin: "8px 0 12px" }}>{exp.title}</h3>
                <p style={{ color: "var(--muted)", whiteSpace: "pre-wrap" }}>
                  {exp.content}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    borderTop: "1px solid var(--line)",
                    paddingTop: "15px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "#fff1e9",
                      color: "#c85b2e",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {(exp.profiles?.full_name || "P")[0].toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: ".95rem" }}>
                      {exp.profiles?.full_name || "PathMate"}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        fontSize: ".8rem",
                      }}
                    >
                      Shared experience
                    </small>
                  </div>
                </div>
              </div>
            ))}
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
                From goal to real experience.
              </h2>
            </div>
            <p style={{ maxWidth: "480px", color: "#cbd5df" }}>
              Get practical insight from someone who has actually lived through
              the journey.
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
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                01
              </div>
              <h3>Tell us your goal</h3>
              <p style={{ color: "#cbd5df" }}>
                Describe what you&apos;re trying to do.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                02
              </div>
              <h3>Find your PathMate</h3>
              <p style={{ color: "#cbd5df" }}>
                Discover someone with relevant experience.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.16)",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#ffad84",
                  fontWeight: 800,
                }}
              >
                03
              </div>
              <h3>Learn from the journey</h3>
              <p style={{ color: "#cbd5df" }}>
                Use their experience to make your next step smarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{ padding: "80px 0", textAlign: "center" }}
      >
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
            Don&apos;t just search for advice. Find someone who&apos;s already walked
            the path.
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your next step could be easier if you learn from someone else&apos;s
            first step.
          </p>
          {user ? (
            <Link
              to="/share"
              style={{
                display: "inline-block",
                border: "none",
                borderRadius: "12px",
                padding: "14px 24px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Share your experience
            </Link>
          ) : (
            <Link
              to="/signup"
              style={{
                display: "inline-block",
                border: "none",
                borderRadius: "12px",
                padding: "14px 24px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Start exploring experiences
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
