import React from "react";
import { FiPieChart, FiAlertTriangle, FiCheckCircle, FiInfo, FiTarget } from "react-icons/fi";
import EmptyState from "./EmptyState";

function BudgetProgress({ budget }) {
  if (!budget || !budget.hasBudget) {
    return (
      <div className="card" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon={<FiPieChart size={28} />}
          title="No Budget Configured"
          description="Set your monthly budget limits to track real-time spending progress."
        />
      </div>
    );
  }

  const { global, categories } = budget;
  const { spent, budget: totalBudget, remaining, percentage } = global;

  let globalStatusColor = "var(--accent-green)";
  let globalStatusBadge = "badge-success";
  if (percentage >= 100) {
    globalStatusColor = "var(--accent-danger)";
    globalStatusBadge = "badge-danger";
  } else if (percentage >= 75) {
    globalStatusColor = "var(--accent-warning)";
    globalStatusBadge = "badge-warning";
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div className="card-header" style={{ marginBottom: '4px' }}>
        <div>
          <h3 className="card-title">Budget Tracking</h3>
          <p className="card-subtitle">Global spending cap & category distribution</p>
        </div>
        <span className={`badge ${globalStatusBadge}`}>
          {percentage}% Used
        </span>
      </div>

      {/* Main Global Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Global Monthly Limit</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            ₹{spent.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ ₹{totalBudget.toLocaleString()}</span>
          </span>
        </div>
        
        <div className="budget-visual-progress" style={{ height: '8px' }}>
          <div 
            className="budget-visual-fill" 
            style={{ 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: globalStatusColor,
              boxShadow: `0 0 12px ${globalStatusColor}40`
            }} 
          />
        </div>
      </div>

      {/* Category Budgets Section */}
      {categories && categories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiTarget size={13} /> Category Caps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat, idx) => {
              let catColor = "var(--bg-accent)";
              if (cat.percentage >= 100) catColor = "var(--accent-danger)";
              else if (cat.percentage >= 80) catColor = "var(--accent-warning)";

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{cat.category}</span>
                    <span style={{ color: cat.percentage >= 100 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                      ₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(cat.percentage, 100)}%`, background: catColor, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Total Spent</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>₹{spent.toLocaleString()}</div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Remaining</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-danger)' }}>
            ₹{Math.abs(remaining).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetProgress;
