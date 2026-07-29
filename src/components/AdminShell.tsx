import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth";
import { isAdmin } from "~/lib/admin";
import { useEffect, useState, type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const routerState = useRouterState();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      isAdmin().then((result) => {
        setIsAdminUser(result);
        setAdminChecked(true);
        if (!result) {
          window.location.href = "/";
        }
      });
    }
  }, [user, authLoading]);

  if (authLoading || !adminChecked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--muted)" }}>Access denied. Redirecting...</div>
      </div>
    );
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", matchExact: true },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/bookings", label: "Bookings" },
    { to: "/admin/revenue", label: "Revenue" },
    { to: "/admin/settings", label: "Settings" },
  ];

  const currentPath = routerState.location.pathname;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{
          width: "240px",
          background: "var(--dark)",
          color: "#fff",
          padding: "20px 0",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: "auto",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "12px" }}>
          <Link
            to="/admin"
            style={{ textDecoration: "none", color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}
          >
            Path<span style={{ color: "var(--accent)" }}>Mates</span>{" "}
            <span style={{ fontSize: "0.75rem", fontWeight: 500, opacity: 0.6 }}>Admin</span>
          </Link>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 12px", flex: 1 }}>
          {navItems.map((item) => {
            const isActive = item.matchExact
              ? currentPath === item.to
              : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.92rem",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "20px", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Link
            to="/"
            style={{
              display: "block",
              padding: "8px 12px",
              borderRadius: "10px",
              textDecoration: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            ← Back to PathMates
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: "240px", flex: 1, padding: "30px 36px", minHeight: "100vh" }}>
        {children}
      </main>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
