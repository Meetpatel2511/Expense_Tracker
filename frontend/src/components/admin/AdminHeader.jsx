import React from "react";
import { FiMenu, FiShield } from "react-icons/fi";
import { UserButton, useUser } from "@clerk/clerk-react";

function AdminHeader({ toggleSidebar }) {
  const { user } = useUser();

  return (
    <header className="header" style={{ borderBottom: "1px solid rgba(124, 58, 237, 0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          className="mobile-only menu-btn"
          onClick={toggleSidebar}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "1.3rem",
            display: "none"
          }}
        >
          <FiMenu />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              color: "#a78bfa",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            <FiShield /> FinTrack SaaS Administration
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ textAlign: "right", display: "none" }} className="desktop-only">
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
            {user?.fullName || "Admin"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 600 }}>
            System Administrator
          </div>
        </div>
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: { width: "38px", height: "38px" }
            }
          }}
        />
      </div>
    </header>
  );
}

export default AdminHeader;
