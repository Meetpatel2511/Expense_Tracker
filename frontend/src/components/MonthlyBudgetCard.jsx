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
  
  // CONFIG: FALLBACK TARGETS IF NOT IN DB
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

  // Extract relevant categories (those with expenses)
  const categoriesPresent = Object.keys(categories);
  
  // Map display data by merging real budgets with expenses
  const displayCategories = categoriesPresent.map(catName => {
    const config = DEFAULT_CONFIG[catName] || DEFAULT_CONFIG["Other"];
    
    // M6: Find real budget from the database status
    const dbBudget = budget.categories?.find(b => b.category === catName);
    const targetLimit = dbBudget ? dbBudget.budget : 5000; // Fallback to 5k if no limit set
    
    const spent = categories[catName] || 0;
    const progress = (spent / targetLimit) * 100;
    
    return {
      name: catName,
      spent,
      target: targetLimit,
      color: config.color,
      icon: config.icon,
      progress,
      isOver: progress > 100
    };
  });

  // M7: Correct path for global budget
  const globalBudget = budget?.global?.budget || 0;
  const totalSpent = Object.values(categories).reduce((sum, val) => sum + val, 0);
  const remaining = globalBudget > 0 ? (globalBudget - totalSpent) : 0;

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Category Breakdown</h3>
        <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {months[selectedMonth - 1]} {selectedYear}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {categoriesPresent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
             <p style={{ fontSize: '0.85rem' }}>No expenses recorded for this month.</p>
          </div>
        ) : (
          displayCategories.map((cat, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                        {cat.icon}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat.name}</div>
                        <div style={{ 
                            fontSize: '0.75rem', 
                            color: cat.isOver ? '#ef4444' : 'var(--text-muted)',
                            fontWeight: cat.isOver ? 700 : 500
                        }}>
                            {cat.progress.toFixed(0)}% used {cat.isOver && "⚠️"}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>₹{cat.spent.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Limit: ₹{cat.target.toLocaleString()}</div>
                </div>
              </div>
              
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
                    style={{ 
                        width: `${Math.min(cat.progress, 100)}%`, 
                        height: '100%', 
                        backgroundColor: cat.isOver ? '#ef4444' : cat.color, 
                        borderRadius: '10px',
                        transition: 'width 1s ease-out'
                    }} 
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
          marginTop: 'auto', 
          padding: '16px', 
          backgroundColor: 'var(--bg-dashboard)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-light)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-accent)' }}></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Remaining</div>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--bg-accent)' }}>
            ₹{remaining.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default MonthlyBudgetCard;

