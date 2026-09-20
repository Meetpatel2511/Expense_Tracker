import React from "react";
import { 
  FiTrendingUp, 
  FiHome, 
  FiShoppingBag, 
  FiLayers, 
  FiCoffee, 
  FiZap, 
  FiActivity, 
  FiBookOpen, 
  FiGlobe, 
  FiPieChart 
} from "react-icons/fi";

function MonthlyBudgetCard({ budget = {}, categories = {}, selectedMonth, selectedYear }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const DEFAULT_CONFIG = {
    "Food & Dining": { color: "#ec4899", icon: <FiCoffee /> },
    "Rent": { color: "#a78bfa", icon: <FiHome /> },
    "Shopping": { color: "#3b82f6", icon: <FiShoppingBag /> },
    "Transportation": { color: "#f59e0b", icon: <FiLayers /> },
    "Groceries": { color: "#10b981", icon: <FiShoppingBag /> },
    "Entertainment": { color: "#7c3aed", icon: <FiTrendingUp /> },
    "Bills & Utilities": { color: "#06b6d4", icon: <FiZap /> },
    "Healthcare": { color: "#ef4444", icon: <FiActivity /> },
    "Education": { color: "#3b82f6", icon: <FiBookOpen /> },
    "Travel": { color: "#f59e0b", icon: <FiGlobe /> },
    "Other": { color: "#94a3b8", icon: <FiPieChart /> }
  };

  const categoriesPresent = Object.keys(categories);
  
  const displayCategories = categoriesPresent.map(catName => {
    const config = DEFAULT_CONFIG[catName] || DEFAULT_CONFIG["Other"];
    const dbBudget = budget.categories?.find(b => b.category === catName);
    const targetLimit = dbBudget ? dbBudget.budget : 0; 
    
    const spent = categories[catName] || 0;
    const progress = targetLimit > 0 ? (spent / targetLimit) * 100 : 0;
    const remaining = targetLimit > 0 ? (targetLimit - spent) : null;
    
    return {
      name: catName,
      spent,
      target: targetLimit,
      color: config.color,
      icon: config.icon,
      progress,
      remaining,
      isOver: targetLimit > 0 && spent > targetLimit
    };
  });

  const globalBudget = budget?.global?.budget || 0;
  const totalSpent = Object.values(categories).reduce((sum, val) => sum + val, 0);
  const globalRemaining = globalBudget > 0 ? (globalBudget - totalSpent) : null;

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card-header" style={{ marginBottom: '4px' }}>
        <div>
          <h3 className="card-title">Category Breakdown</h3>
          <p className="card-subtitle">Spending limits for active categories</p>
        </div>
        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
          {months[selectedMonth - 1]} {selectedYear}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {categoriesPresent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.85rem' }}>No expenses recorded for this month.</p>
          </div>
        ) : (
          displayCategories.map((cat, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: `${cat.color}15`, 
                    color: cat.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.95rem' 
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{cat.name}</div>
                    <div style={{ 
                      fontSize: '0.72rem', 
                      color: cat.isOver ? 'var(--accent-danger)' : 'var(--text-muted)',
                      fontWeight: cat.isOver ? 700 : 500
                    }}>
                      {cat.progress.toFixed(0)}% used {cat.isOver && "⚠️"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>₹{cat.spent.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {cat.target > 0 ? `Limit: ₹${cat.target.toLocaleString()}` : "No limit set"}
                  </div>
                </div>
              </div>
              
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${cat.target > 0 ? Math.min(cat.progress, 100) : 0}%`, 
                    height: '100%', 
                    backgroundColor: cat.isOver ? 'var(--accent-danger)' : (cat.target > 0 ? cat.color : 'transparent'), 
                    borderRadius: '10px',
                    transition: 'width 0.8s ease-out'
                  }} 
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        marginTop: 'auto', 
        padding: '14px 16px', 
        backgroundColor: 'rgba(255, 255, 255, 0.02)', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: globalRemaining !== null ? (globalRemaining >= 0 ? 'var(--accent-green)' : 'var(--accent-danger)') : 'var(--text-muted)' }}></div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Remaining</div>
        </div>
        <div style={{ 
          fontSize: '1rem', 
          fontWeight: 800, 
          color: globalRemaining !== null ? (globalRemaining >= 0 ? 'var(--accent-green)' : 'var(--accent-danger)') : 'var(--text-muted)' 
        }}>
          {globalRemaining !== null ? (
            globalRemaining >= 0 
              ? `₹${globalRemaining.toLocaleString()}` 
              : `Over by ₹${Math.abs(globalRemaining).toLocaleString()}`
          ) : "No limit set"}
        </div>
      </div>
    </div>
  );
}

export default MonthlyBudgetCard;
