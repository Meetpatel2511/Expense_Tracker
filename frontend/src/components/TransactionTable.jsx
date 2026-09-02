import React from "react";
import { useNavigate } from "react-router-dom";

function TransactionTable({ expenses = [] }) {
  const navigate = useNavigate();

  const getCategoryTheme = (category) => {
    const cat = category?.toLowerCase();
    
    if (cat?.includes("food") || cat?.includes("dining")) return { icon: "🍽️", color: "#ec4899" };
    if (cat?.includes("shopping")) return { icon: "🛍️", color: "#eab308" };
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
      amount: `- ₹${exp.amount.toLocaleString()}`,
      icon: theme.icon,
      color: theme.color
    };
  });

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Transactions</h3>
        <button 
          onClick={() => navigate("/expenses")}
          style={{ background: 'none', border: 'none', color: 'var(--bg-accent)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.5px' }}
        >
          VIEW ALL
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No transactions yet</div>
          <div className="empty-state-subtext">Your recent expenses will appear here once you start tracking.</div>
        </div>
      ) : (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ENTITY</th>
              <th>CATEGORY</th>
              <th className="hide-mobile">DATE</th>
              <th className="hide-mobile">STATUS</th>
              <th style={{ textAlign: 'right' }}>AMOUNT</th>
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
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                        color: txn.color, 
                        fontWeight: 700,
                        flexShrink: 0
                    }}>
                      {txn.icon}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{txn.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {txn.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{txn.category}</td>
                <td className="hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{txn.date}</td>
                <td className="hide-mobile">
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    backgroundColor: txn.status === 'Completed' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(167, 139, 250, 0.15)', 
                    color: txn.status === 'Completed' ? '#94a3b8' : '#a78bfa' 
                  }}>
                    {txn.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 700, color: String(txn.amount).startsWith('+') ? '#10b981' : '#fff' }}>
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
