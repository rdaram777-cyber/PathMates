import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getRevenueStats, type CurrencyTotals } from "~/lib/admin";
import { AdminShell } from "~/components/AdminShell";
import { formatAmountCents } from "~/lib/currency";

export const Route = createFileRoute("/admin/revenue")({
  component: AdminRevenue,
});

/** Render a per-currency totals record, e.g. "$8.00 + ₹798.00". */
function formatTotals(totals: CurrencyTotals): string {
  const parts: string[] = [];
  if ((totals.USD ?? 0) > 0) parts.push(formatAmountCents(totals.USD, "USD"));
  if ((totals.INR ?? 0) > 0) parts.push(formatAmountCents(totals.INR, "INR"));
  return parts.length > 0 ? parts.join(" + ") : formatAmountCents(0, "USD");
}

function AdminRevenue() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getRevenueStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!stats) return;
    const headers = ["Date", "Currency", "Revenue", "Platform Fee"];
    const rows = stats.daily_revenue.map((d) => [
      d.date,
      d.currency,
      (d.revenue / 100).toFixed(2),
      (d.platform_fee / 100).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathmates-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Revenue Dashboard</h1>
        <button
          onClick={handleExportCSV}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "var(--dark)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading revenue data...</div>
      ) : !stats ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Failed to load data.</div>
      ) : (
        <>
          {/* Revenue Cards — INR and USD are reported separately (paise vs cents) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}>
            <RevenueCard label="Total Revenue (All Time)" value={formatTotals(stats.total_revenue)} color="var(--accent)" />
            <RevenueCard label="This Month's Revenue" value={formatTotals(stats.month_revenue)} color="#10b981" />
            <RevenueCard label="Platform Earnings (30%)" value={formatTotals(stats.platform_earnings)} color="#8b5cf6" />
            <RevenueCard label="PathMate Payouts (70%)" value={formatTotals(stats.pathmate_payouts)} color="#3b82f6" />
          </div>

          {/* Daily Revenue Table (Last 30 Days) */}
          <div className="card" style={{ overflowX: "auto", padding: "0" }}>
            <h2 style={{ padding: "16px 20px 0", fontSize: "1.1rem", fontWeight: 600 }}>Revenue by Day (Last 30 Days)</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", marginTop: "8px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left", background: "rgba(0,0,0,0.02)" }}>
                  <th style={{ padding: "12px 20px", color: "var(--muted)", fontWeight: 600 }}>Date</th>
                  <th style={{ padding: "12px 20px", color: "var(--muted)", fontWeight: 600 }}>Currency</th>
                  <th style={{ padding: "12px 20px", color: "var(--muted)", fontWeight: 600 }}>Revenue</th>
                  <th style={{ padding: "12px 20px", color: "var(--muted)", fontWeight: 600 }}>Platform Fee</th>
                  <th style={{ padding: "12px 20px", color: "var(--muted)", fontWeight: 600 }}>PathMate Payout</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily_revenue.map((day) => {
                  const pathmatePayout = day.revenue - day.platform_fee;
                  return (
                    <tr key={`${day.date}|${day.currency}`} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 20px", fontWeight: 500 }}>{day.date}</td>
                      <td style={{ padding: "10px 20px", color: "var(--muted)" }}>{day.currency}</td>
                      <td style={{ padding: "10px 20px" }}>{formatAmountCents(day.revenue, day.currency)}</td>
                      <td style={{ padding: "10px 20px", color: "var(--muted)" }}>{formatAmountCents(day.platform_fee, day.currency)}</td>
                      <td style={{ padding: "10px 20px", color: "var(--muted)" }}>{formatAmountCents(pathmatePayout, day.currency)}</td>
                    </tr>
                  );
                })}
                {stats.daily_revenue.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                      No revenue data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
    </AdminShell>
  );
}

function RevenueCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
