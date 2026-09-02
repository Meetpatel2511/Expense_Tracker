const FAMILY_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

function FamilyCard({ data, index = 0 }) {
  const color = FAMILY_COLORS[index % FAMILY_COLORS.length];
  const initial = data.name ? data.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="family-member">
      <div className="family-member-avatar" style={{ backgroundColor: color }}>
        {initial}
      </div>

      <div className="family-member-info">
        <div className="family-member-name">{data.name}</div>
      </div>

      <div className="family-member-stats">
        <div className="family-member-amount">₹{(data.total || 0).toLocaleString("en-IN")}</div>
      </div>
    </div>
  );
}

export default FamilyCard;