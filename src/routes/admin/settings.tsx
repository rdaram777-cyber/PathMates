import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateCommission, getPlatformSetting } from "~/lib/admin";
import { getCommissionPercent } from "~/lib/stripe";
import { AdminShell } from "~/components/AdminShell";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [commission, setCommission] = useState(30);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCommissionPercent(),
      getPlatformSetting("commission_percent"),
    ]).then(([percent, setting]) => {
      setCommission(percent);
      if (setting) {
        setLastUpdated(new Date(setting.updated_at).toLocaleString());
      }
    });
  }, []);

  const handleSave = async () => {
    if (commission < 0 || commission > 100) {
      setMessage("Commission must be between 0 and 100.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await updateCommission(commission);
      setLastUpdated(new Date().toLocaleString());
      setMessage("Commission updated successfully!");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "24px" }}>Platform Settings</h1>

      <div className="card" style={{ maxWidth: "560px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Commission Rate</h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "6px", color: "var(--muted)" }}>
            Platform Commission Percentage
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              min={0}
              max={100}
              value={commission}
              onChange={(e) => setCommission(parseInt(e.target.value) || 0)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "1rem",
                width: "100px",
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>%</span>
          </div>
        </div>

        {lastUpdated && (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "12px" }}>
            Last updated: {lastUpdated}
          </p>
        )}

        <div style={{
          padding: "12px",
          borderRadius: "10px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          fontSize: "0.82rem",
          color: "#92400e",
          marginBottom: "16px",
        }}>
          <strong>Note:</strong> Changing the commission rate only affects future bookings. Existing bookings retain their original commission.
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            border: "none",
            background: saving ? "var(--line)" : "var(--accent)",
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          {saving ? "Saving..." : "Save Commission"}
        </button>

        {message && (
          <p style={{
            marginTop: "12px",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: message.includes("success") ? "#10b981" : "#ef4444",
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
    </AdminShell>
  );
}
