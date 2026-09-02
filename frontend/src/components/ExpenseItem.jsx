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
  "Food & Dining": "var(--accent-orange-light)",
  "Shopping": "var(--accent-pink-light)",
  "Transportation": "var(--accent-blue-light)",
  "Entertainment": "var(--accent-purple-light)",
  "Bills & Utilities": "var(--accent-red-light)",
  "Healthcare": "var(--accent-green-light)",
  "Education": "var(--accent-blue-light)",
  "Travel": "var(--accent-purple-light)",
  "Groceries": "var(--accent-green-light)",
  "Rent": "var(--accent-orange-light)",
  "Other": "var(--accent-blue-light)"
};

function ExpenseItem({ exp, refresh, onEdit }) {
  const deleteExp = async () => {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
        <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>Delete this expense?</div>
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
            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000, position: "top-center" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const icon = CATEGORY_ICONS[exp.category] || "📋";
  const bgColor = CATEGORY_COLORS[exp.category] || "var(--accent-blue-light)";

  return (
    <div className="expense-item">
      <div className="expense-item-icon" style={{ background: bgColor }}>
        {icon}
      </div>

      <div className="expense-item-details">
        <div className="expense-item-category">{exp.category}</div>
        <div className="expense-item-note">{exp.note || "No note"}</div>
      </div>

      <div className="expense-item-date">{formatDate(exp.date)}</div>

      <div className="expense-item-amount expense">
        - ₹{exp.amount.toLocaleString("en-IN")}
      </div>

      <div className="expense-item-actions">
        {onEdit && (
          <button className="btn-icon edit" onClick={() => onEdit(exp)} title="Edit">
            <FiEdit2 size={14} />
          </button>
        )}
        <button className="btn-icon delete" onClick={deleteExp} title="Delete">
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default ExpenseItem;