import React from "react";
import { FiMenu, FiShield } from "react-icons/fi";
import { UserButton, useUser } from "@clerk/clerk-react";

function AdminHeader({ toggleSidebar }) {
  const { user } = useUser();

  return (
    <header className="header" style={{ borderBottom: "1px solid var(--border-color)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          className="header-icon-btn mobile-only"
          onClick={toggleSidebar}
          aria-label="Open Admin Menu"
          style={{ display: "none" }}
        >
          <FiMenu size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="badge badge-pro" style={{ fontSize: "0.75rem", padding: "4px 12px" }}>
            <FiShield size={13} /> FinTrack SaaS Administration
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ textAlign: "right" }} className="hide-mobile">
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
            {user?.fullName || "Admin"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#c4b5fd", fontWeight: 600 }}>
            System Administrator
          </div>
        </div>
        <div className="header-profile" style={{ flexShrink: 0 }}>
          <UserButton
            afterSignOutUrl="/sign-in"
            userButtonPopoverPlacement="bottom-end"
            appearance={{
              elements: {
                userButtonAvatarBox: { width: "38px", height: "38px", borderRadius: "50%", border: "2px solid rgba(124, 58, 237, 0.4)" }
              }
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </header>
  );
}

export default AdminHeader;
