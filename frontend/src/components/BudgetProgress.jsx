import React from "react";
import { FiPieChart, FiAlertTriangle, FiCheckCircle, FiInfo, FiArrowRight, FiTarget } from "react-icons/fi";

function BudgetProgress({ budget }) {
  if (!budget || !budget.hasBudget) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center', gap: '16px' }}>
        <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', color: 'var(--bg-accent)' }}>
            <FiPieChart size={40} />
        </div>
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No Budget Set</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set your monthly budget to track your spending effectively.</p>
        </div>
      </div>
    );
  }

  const { global, categories } = budget;
  const { spent, budget: totalBudget, remaining, percentage, status } = global;

  // Determine status color for global
  let globalStatusColor = "var(--accent-green)";
  let globalStatusIcon = <FiCheckCircle />;
  if (percentage >= 100) {
    globalStatusColor = "var(--accent-danger)";
    globalStatusIcon = <FiAlertTriangle />;
  } else if (percentage >= 75) {
    globalStatusColor = "var(--accent-warning)";
    globalStatusIcon = <FiInfo />;
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Budget Tracking</h3>
        <div className="badge" style={{ color: globalStatusColor, borderColor: globalStatusColor, background: `${globalStatusColor}10` }}>
          {percentage}% Used
        </div>
      </div>

      {/* Main Global Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Global Monthly Limit</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{spent.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ ₹{totalBudget.toLocaleString()}</span></span>
        </div>
        
        <div className="budget-visual-progress" style={{ height: '10px' }}>
            <div 
                className="budget-visual-fill" 
                style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    backgroundColor: globalStatusColor,
                    boxShadow: `0 0 15px ${globalStatusColor}40`
                }} 
            />
        </div>
      </div>

      {/* Category Budgets Section */}
      {categories && categories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiTarget /> Category Caps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map((cat, idx) => {
              let catColor = "var(--bg-accent)";
              if (cat.percentage >= 100) catColor = "var(--accent-danger)";
              else if (cat.percentage >= 80) catColor = "var(--accent-warning)";

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600 }}>{cat.category}</span>
                    <span style={{ color: cat.percentage >= 100 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                      ₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(cat.percentage, 100)}%`, background: catColor, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="budget-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Spent</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>₹{spent.toLocaleString()}</div>
        </div>
        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-danger)' }}>
                ₹{Math.abs(remaining).toLocaleString()}
            </div>
        </div>
      </div>

      {/* Daily Advice */}
      <div style={{ 
          padding: '12px', 
          borderRadius: '10px', 
          background: 'rgba(124, 58, 237, 0.05)', 
          border: '1px solid rgba(124, 58, 237, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            💡 Daily limit to stay on track: <strong>₹{Math.max(0, Math.floor(remaining / 15)).toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}

export default BudgetProgress;
