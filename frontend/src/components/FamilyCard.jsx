import React from "react";

const FAMILY_COLORS = ["#7c3aed", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#06b6d4"];

function FamilyCard({ data, index = 0 }) {
  const color = FAMILY_COLORS[index % FAMILY_COLORS.length];
  const initial = data.name ? data.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="family-member">
      <div className="family-member-avatar" style={{ backgroundColor: color, boxShadow: `0 4px 14px ${color}35` }}>
        {initial}
      </div>

      <div className="family-member-info">
        <div className="family-member-name">{data.name || "Family Member"}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {data.role || "Member"}
        </div>
      </div>

      <div className="family-member-stats">
        <div className="family-member-amount">₹{(data.total || 0).toLocaleString("en-IN")}</div>
        <div className="family-member-percent">Monthly Share</div>
      </div>
    </div>
  );
}

export default FamilyCard;