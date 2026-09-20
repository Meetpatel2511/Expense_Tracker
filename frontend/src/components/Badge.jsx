import React from "react";

function Badge({ children, variant = "neutral", icon, className = "", style = {} }) {
  const variantClass = variant ? `badge-${variant}` : "badge-neutral";

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} style={style}>
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
