import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole, verifyPathmate, type Profile } from "~/lib/admin";
import { AdminShell } from "~/components/AdminShell";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = () => {
    setLoading(true);
    getAllUsers({ search: search || undefined, role: roleFilter !== "all" ? roleFilter : undefined })
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole({ userId, role: newRole });
      loadUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleVerifyToggle = async (userId: string) => {
    try {
      await verifyPathmate({ data: userId });
      loadUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AdminShell>
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "24px" }}>User Management</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "0.9rem",
            minWidth: "220px",
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">All Roles</option>
          <option value="explorer">Explorer</option>
          <option value="pathmate">PathMate</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflowX: "auto", padding: "0" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading users...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left", background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Verified</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Reviews</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Joined</th>
                <th style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <Link
                      to="/profile/$userId"
                      params={{ userId: user.id }}
                      style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
                    >
                      {user.full_name || "Unnamed"}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                    {user.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: user.role === "admin" ? "rgba(139,92,246,0.15)" : user.role === "pathmate" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                      color: user.role === "admin" ? "#8b5cf6" : user.role === "pathmate" ? "#10b981" : "#3b82f6",
                      textTransform: "capitalize",
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {user.role === "pathmate" ? (
                      <button
                        onClick={() => handleVerifyToggle(user.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: user.verified ? "#10b981" : "var(--line)",
                          color: user.verified ? "#fff" : "var(--muted)",
                        }}
                      >
                        {user.verified ? "✓ Verified" : "Verify"}
                      </button>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>{user.review_count}</td>
                  <td style={{ padding: "10px 16px", color: "var(--muted)", fontSize: "0.82rem" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleRoleChange(user.id, "admin")}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(139,92,246,0.15)",
                            color: "#8b5cf6",
                          }}
                        >
                          Make Admin
                        </button>
                      )}
                      {user.role === "admin" && (
                        <button
                          onClick={() => handleRoleChange(user.id, "explorer")}
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
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                    No users found.
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
