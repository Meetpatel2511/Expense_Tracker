import React from "react";

function PageHeader({ title, subtitle, badge, children }) {
  return (
    <div className="page-header-container">
      <div className="page-header-text">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 className="page-header-title">{title}</h1>
          {badge && <span className="badge badge-pro">{badge}</span>}
        </div>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export default PageHeader;
