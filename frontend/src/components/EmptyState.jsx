import React from "react";

function EmptyState({ icon, title, description, actionText, onAction, actionIcon }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <div className="empty-state-title">{title}</div>}
      {description && <div className="empty-state-desc">{description}</div>}
      {actionText && onAction && (
        <button type="button" onClick={onAction} className="btn-secondary" style={{ marginTop: "8px" }}>
          {actionIcon && <span>{actionIcon}</span>}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

export default EmptyState;
