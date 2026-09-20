import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiActivity } from "react-icons/fi";
import EmptyState from "./EmptyState";

function TransactionTable({ expenses = [] }) {
  const navigate = useNavigate();

  const getCategoryTheme = (category) => {
    const cat = category?.toLowerCase();
    
    if (cat?.includes("food") || cat?.includes("dining")) return { icon: "🍽️", color: "#ec4899" };
    if (cat?.includes("shopping")) return { icon: "🛍️", color: "#f59e0b" };
    if (cat?.includes("transport") || cat?.includes("travel")) return { icon: "🚗", color: "#3b82f6" };
    if (cat?.includes("bill") || cat?.includes("utility") || cat?.includes("services")) return { icon: "💡", color: "#8b5cf6" };
    if (cat?.includes("health") || cat?.includes("medical")) return { icon: "🏥", color: "#ef4444" };
    if (cat?.includes("income") || cat?.includes("salary")) return { icon: "💰", color: "#10b981" };
    if (cat?.includes("rent") || cat?.includes("home")) return { icon: "🏠", color: "#a78bfa" };
    
    return { icon: category?.charAt(0) || "T", color: "#94a3b8" };
  };

  const transactions = (Array.isArray(expenses) ? expenses : []).slice(0, 5).map(exp => {
    const theme = getCategoryTheme(exp.category);
    return {
      name: exp.note || exp.category || "Expense",
      id: exp._id?.toString().slice(-4).toUpperCase() || "N/A",
      category: exp.category || "General",
      date: new Date(exp.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Completed",
      amount: `- ₹${Number(exp.amount || 0).toLocaleString()}`,
      icon: theme.icon,
      color: theme.color
    };
  });

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Recent Transactions</h3>
          <p className="card-subtitle">Latest activity across your accounts</p>
        </div>
        <button 
          onClick={() => navigate("/expenses")}
          className="btn-ghost"
          style={{ fontSize: '0.8rem', color: '#c4b5fd' }}
        >
          <span>View All</span>
          <FiArrowRight size={14} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<FiActivity size={24} />}
          title="No transactions yet"
          description="Your recent expenses will appear here once you start tracking."
          actionText="Add Expense"
          onAction={() => navigate("/expenses")}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th className="hide-mobile">Date</th>
                <th className="hide-mobile">Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                        color: txn.color, 
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {txn.icon}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {txn.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          ID: #{txn.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {txn.category}
                    </span>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {txn.date}
                  </td>
                  <td className="hide-mobile">
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {txn.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 700, color: String(txn.amount).startsWith('+') ? 'var(--accent-green)' : '#fff' }}>
                    {txn.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

export default TransactionTable;
