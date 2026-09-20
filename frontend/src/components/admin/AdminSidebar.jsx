import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiCreditCard,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiArrowLeft,
  FiShield,
  FiX
} from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";
import BrandLogo from "../BrandLogo";

const adminNavItems = [
  { path: "/admin", icon: <FiGrid />, label: "Dashboard", end: true },
  { path: "/admin/payments", icon: <FiCreditCard />, label: "Payments Queue", end: false },
  { path: "/admin/subscriptions", icon: <FiAward />, label: "Subscriptions", end: false },
  { path: "/admin/users", icon: <FiUsers />, label: "Users Directory", end: false },
  { path: "/admin/analytics", icon: <FiTrendingUp />, label: "Analytics & MRR", end: false },
];

function AdminSidebar({ isOpen, toggleSidebar }) {
  const { adminUser } = useAdmin();

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`} style={{ borderColor: "rgba(124, 58, 237, 0.2)" }}>
      {/* Mobile Close Button */}
      <button
        className="mobile-only"
        onClick={toggleSidebar}
        aria-label="Close Admin Sidebar"
        style={{
          position: "absolute",
          top: "20px",
          right: "16px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          color: "var(--text-secondary)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          cursor: "pointer",
          zIndex: 1001
        }}
      >
        <FiX size={18} />
      </button>

      {/* Admin Branding */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ marginBottom: "8px" }}>
          <BrandLogo variant="navbar" to="/admin" />
        </div>
        <div style={{ paddingLeft: "4px" }}>
          <span className="badge badge-pro" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
            <FiShield size={12} /> Admin Portal
          </span>
        </div>
      </div>

      {/* Admin Profile Pill */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-color)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.9rem",
            flexShrink: 0
          }}
        >
          {adminUser?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {adminUser?.name || "Administrator"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {adminUser?.email || "admin@fintrack.app"}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", paddingLeft: "12px", marginBottom: "6px" }}>
          Platform Management
        </div>

        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="nav-item"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "11px 14px",
              borderRadius: "12px",
              cursor: "pointer",
              textDecoration: "none",
              transition: "var(--transition)",
              backgroundColor: isActive ? "rgba(124, 58, 237, 0.18)" : "transparent",
              color: isActive ? "#c4b5fd" : "var(--text-secondary)",
              fontWeight: isActive ? 700 : 500,
              border: isActive ? "1px solid rgba(124, 58, 237, 0.3)" : "1px solid transparent"
            })}
          >
            <div style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ fontSize: "0.9rem" }}>{item.label}</div>
          </NavLink>
        ))}
      </nav>

      {/* Return to Normal App */}
      <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-color)", marginTop: "auto" }}>
        <NavLink
          to="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "11px 14px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            transition: "var(--transition)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <FiArrowLeft style={{ fontSize: "1.05rem" }} />
          <span>Back to User App</span>
        </NavLink>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </aside>
  );
}

export default AdminSidebar;
