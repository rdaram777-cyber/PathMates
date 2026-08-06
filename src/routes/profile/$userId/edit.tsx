import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";
import { createSupabaseClient } from "~/db";

const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", outline: "none", fontSize: "inherit", font: "inherit", background: "var(--bg)" };

const getProfile = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const sb = createSupabaseClient();
    const { data: profile, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw new Error(error.message);
    return profile;
  });

export const Route = createFileRoute("/profile/$userId/edit")({
  loader: ({ params }) => getProfile({ data: params.userId }),
  component: EditProfile,
});

function EditProfile() {
  const profile = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioShort, setBioShort] = useState(profile.bio_short ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(profile.years_of_experience?.toString() ?? "");
  const [currentRole, setCurrentRole] = useState(profile.current_role ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate ?? 5000);
  const [languagesInput, setLanguagesInput] = useState(
    (profile.languages ?? []).join(", "),
  );
  const [skillsInput, setSkillsInput] = useState(
    (profile.skills ?? []).join(", "),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Guard: only allow editing own profile
  useEffect(() => {
    if (user && user.id !== profile.id) {
      navigate({ to: "/profile/$userId", params: { userId: profile.id } });
    }
  }, [user, profile.id, navigate]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      let avatarUrl = profile.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const languages = languagesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          bio_short: bioShort.trim() || null,
          country: country.trim() || null,
          years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : null,
          current_role: currentRole.trim() || null,
          headline: headline.trim() || null,
          hourly_rate: hourlyRate,
          languages,
          skills,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setMessage("Profile updated successfully.");
      setTimeout(() => {
        navigate({ to: "/profile/$userId", params: { userId: profile.id } });
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.id !== profile.id) {
    return null;
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
          Edit Profile
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          Update your public profile.
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
          {/* Avatar */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Profile picture
            </label>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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
                  overflow: "hidden",
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={fullName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (fullName || "P")[0].toUpperCase()
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ fontSize: ".9rem" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
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
                minHeight: "120px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Years of Experience</label>
            <input type="number" min="0" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="5" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Current Role</label>
            <input type="text" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="Product Designer" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Headline</label>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="I help teams build better products" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Hourly Rate (₹/USD)</label>
            <input type="number" min="0" step="0.01" value={(hourlyRate / 100).toString()} onChange={(e) => setHourlyRate(Math.round(Number(e.target.value || 0) * 100))} style={inputStyle} />
            <small style={{ color: "var(--muted)" }}>Displayed rate is stored in cents.</small>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Languages (comma-separated)
            </label>
            <input
              type="text"
              value={languagesInput}
              onChange={(e) => setLanguagesInput(e.target.value)}
              placeholder="English, Spanish, French"
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
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Business strategy, Leadership, Public speaking"
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/profile/$userId",
                  params: { userId: profile.id },
                })
              }
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
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
