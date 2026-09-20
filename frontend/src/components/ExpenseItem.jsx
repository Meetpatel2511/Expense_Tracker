import React from "react";
import API from "../utils/api";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const CATEGORY_ICONS = {
  "Food & Dining": "🍽️",
  "Shopping": "🛍️",
  "Transportation": "🚗",
  "Entertainment": "🎬",
  "Bills & Utilities": "💡",
  "Healthcare": "🏥",
  "Education": "📚",
  "Travel": "✈️",
  "Groceries": "🛒",
  "Rent": "🏠",
  "Other": "📋"
};

const CATEGORY_COLORS = {
  "Food & Dining": "rgba(249, 115, 22, 0.12)",
  "Shopping": "rgba(236, 72, 153, 0.12)",
  "Transportation": "rgba(59, 130, 246, 0.12)",
  "Entertainment": "rgba(167, 139, 250, 0.12)",
  "Bills & Utilities": "rgba(239, 68, 68, 0.12)",
  "Healthcare": "rgba(16, 185, 129, 0.12)",
  "Education": "rgba(59, 130, 246, 0.12)",
  "Travel": "rgba(167, 139, 250, 0.12)",
  "Groceries": "rgba(16, 185, 129, 0.12)",
  "Rent": "rgba(249, 115, 22, 0.12)",
  "Other": "rgba(148, 163, 184, 0.12)"
};

function ExpenseItem({ exp, refresh, onEdit }) {
  const deleteExp = async () => {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
        <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>Delete this expense record?</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await API.delete(`/expense/${exp._id}`);
                refresh();
                toast.success("Expense deleted");
              } catch (err) {
                toast.error("Failed to delete");
              }
            }}
            style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'var(--accent-danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000, position: "top-center" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const icon = CATEGORY_ICONS[exp.category] || "📋";
  const bgColor = CATEGORY_COLORS[exp.category] || "rgba(124, 58, 237, 0.12)";

  return (
    <div className="expense-item">
      <div className="expense-item-icon" style={{ background: bgColor }}>
        {icon}
      </div>

      <div className="expense-item-details">
        <div className="expense-item-category">{exp.category || "Expense"}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {exp.note || "No description"}
        </div>
      </div>

      <div className="expense-item-date hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {formatDate(exp.date)}
      </div>

      <div className="expense-item-amount" style={{ color: '#fff' }}>
        - ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
      </div>

      <div className="expense-item-actions">
        {onEdit && (
          <button className="btn-icon edit" onClick={() => onEdit(exp)} title="Edit expense" aria-label="Edit expense">
            <FiEdit2 size={13} />
          </button>
        )}
        <button className="btn-icon delete" onClick={deleteExp} title="Delete expense" aria-label="Delete expense">
          <FiTrash2 size={13} />
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

export default ExpenseItem;