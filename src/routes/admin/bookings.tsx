import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAllBookings, refundBooking, type BookingWithNames } from "~/lib/admin";
import { AdminShell } from "~/components/AdminShell";
import { formatAmountCents } from "~/lib/currency";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

function formatCents(cents: number, currency?: string | null): string {
  return formatAmountCents(cents, currency);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadBookings = () => {
    setLoading(true);
    getAllBookings({
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: search || undefined,
    })
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [search, statusFilter]);

  const handleRefund = async (bookingId: string) => {
    if (!confirm("Mark this booking as refunded? This does not process a Stripe refund.")) return;
    try {
      await refundBooking(bookingId);
      loadBookings();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AdminShell>
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "24px" }}>Bookings Management</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by explorer or pathmate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "0.9rem",
            minWidth: "260px",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Bookings table */}
      <div className="card" style={{ overflowX: "auto", padding: "0" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading bookings...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left", background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Explorer</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>PathMate</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Date/Time</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Fee</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>
                    {booking.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Link
                      to="/profile/$userId"
                      params={{ userId: booking.explorer_id }}
                      style={{ color: "var(--accent)", textDecoration: "none" }}
                    >
                      {booking.explorer?.full_name || "Unknown"}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Link
                      to="/profile/$userId"
                      params={{ userId: booking.pathmate_id }}
                      style={{ color: "var(--accent)", textDecoration: "none" }}
                    >
                      {booking.pathmate?.full_name || "Unknown"}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "0.82rem", color: "var(--muted)" }}>
                    {formatDate(booking.scheduled_at)}
                  </td>
                  <td style={{ padding: "10px 16px" }}>{formatCents(booking.amount_cents, booking.currency)}</td>
                  <td style={{ padding: "10px 16px", color: "var(--muted)" }}>{formatCents(booking.platform_fee_cents, booking.currency)}</td>
                  <td style={{ padding: "10px 16px" }}><StatusBadge status={booking.status} /></td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <Link
                        to="/bookings"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          background: "var(--line)",
                          color: "var(--text)",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </Link>
                      {booking.status !== "refunded" && booking.status !== "cancelled" && (
                        <button
                          onClick={() => handleRefund(booking.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(239,68,68,0.15)",
                            color: "#ef4444",
                          }}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </AdminShell>
  );
}
