import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "~/lib/auth";
import { createSupabaseClient } from "~/db";

const getProfile = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const sb = createSupabaseClient();
    const { data: profile, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  });

export const Route = createFileRoute("/profile/$userId")({
  loader: ({ params }) => getProfile(params.userId),
  component: ProfileView,
});

function ProfileView() {
  const profile = Route.useLoaderData();
  const { user } = useAuth();
  const isOwn = user?.id === profile.id;

  if (!profile) {
    return (
      <main style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Profile not found.</p>
      </main>
    );
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
          width: "min(720px, 100%)",
          margin: "auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "20px",
          padding: "32px",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#fff1e9",
            color: "#c85b2e",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: "2rem",
            marginBottom: "16px",
            overflow: "hidden",
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            (profile.full_name ?? "P")[0].toUpperCase()
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                margin: "0 0 4px",
                letterSpacing: "-.03em",
              }}
            >
              {profile.full_name || "PathMate"}
            </h1>
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
              {profile.role === "pathmate"
                ? "PathMate"
                : profile.role === "admin"
                  ? "Admin"
                  : "Explorer"}
            </span>
          </div>

          {isOwn && (
            <Link
              to="/profile/$userId/edit"
              params={{ userId: profile.id }}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "10px 16px",
                fontWeight: 700,
                background: "transparent",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: ".9rem",
              }}
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile.bio && (
          <p style={{ color: "var(--muted)", marginBottom: "20px", lineHeight: 1.6 }}>
            {profile.bio}
          </p>
        )}

        {(profile.languages?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", marginBottom: "6px", fontSize: ".9rem" }}>
              Languages
            </strong>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {profile.languages?.map((lang) => (
                <span
                  key={lang}
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
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.skills?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", marginBottom: "6px", fontSize: ".9rem" }}>
              Skills
            </strong>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  style={{
                    display: "inline-block",
                    background: "#fff1e9",
                    borderRadius: "999px",
                    padding: "6px 9px",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    color: "#c85b2e",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
