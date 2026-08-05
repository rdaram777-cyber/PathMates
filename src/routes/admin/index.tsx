import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminStats, type BookingWithNames } from "~/lib/admin";
import { AdminShell } from "~/components/AdminShell";
import { formatAmountCents } from "~/lib/currency";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function formatCents(cents: number, currency?: string | null): string {
  return formatAmountCents(cents, currency);
}

/** Platform revenue card shows USD and INR separately (paise ≠ cents). */
function formatPlatformRevenue(usdCents: number, inrPaise: number): string {
  const parts: string[] = [];
  if (usdCents > 0) parts.push(formatAmountCents(usdCents, "USD"));
  if (inrPaise > 0) parts.push(formatAmountCents(inrPaise, "INR"));
  return parts.length > 0 ? parts.join(" + ") : formatAmountCents(0, "USD");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    paid: "#10b981",
    completed: "#3b82f6",
    cancelled: "#ef4444",
    refunded: "#8b5cf6",
  };
  const color = colors[status] || "#6b7280";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: `${color}20`,
        color,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading dashboard...</div>
      ) : !stats ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Failed to load dashboard data.</div>
      ) : (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "24px" }}>Admin Dashboard</h1>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "32px",
      }}>
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Bookings (This Month)" value={stats.total_bookings} />
        <StatCard label="Platform Revenue (This Month)" value={formatPlatformRevenue(stats.platform_revenue, stats.platform_revenue_inr)} />
        <StatCard label="Active PathMates" value={stats.active_pathmates} />
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>Revenue (Last 7 Days)</h2>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          height: "140px",
          padding: "10px 0",
        }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const height = Math.floor(Math.random() * 80) + 20;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${height}px`,
                    background: "var(--accent)",
                    borderRadius: "6px 6px 0 0",
                    opacity: 0.8,
                  }}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                  {new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "8px", fontStyle: "italic" }}>
          Placeholder chart — real data coming soon.
        </p>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Recent Bookings</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", color: "var(--muted)", fontWeight: 600 }}>Explorer</th>
                <th style={{ padding: "8px 12px", color: "var(--muted)", fontWeight: 600 }}>PathMate</th>
                <th style={{ padding: "8px 12px", color: "var(--muted)", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "8px 12px", color: "var(--muted)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "8px 12px", color: "var(--muted)", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "8px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_bookings.map((booking: BookingWithNames) => (
                <tr key={booking.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 12px" }}>{booking.explorer?.full_name || "Unknown"}</td>
                  <td style={{ padding: "8px 12px" }}>{booking.pathmate?.full_name || "Unknown"}</td>
                  <td style={{ padding: "8px 12px" }}>{formatCents(booking.amount_cents, booking.currency)}</td>
                  <td style={{ padding: "8px 12px" }}><StatusBadge status={booking.status} /></td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)", fontSize: "0.85rem" }}>{formatDate(booking.created_at)}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <Link
                      to="/admin/bookings"
                      style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {stats.recent_bookings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
