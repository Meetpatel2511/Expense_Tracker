import React from "react";
import { FiTrendingUp, FiTrendingDown, FiPieChart, FiDollarSign } from "react-icons/fi";

function StatCard({ title, value, subtext, icon, trend, color }) {
  const isPositive = trend && trend.startsWith('+');

  return (
    <div className="card" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', // Standardized gap
      position: 'relative',
      overflow: 'hidden',
      padding: '24px', // Explicit standard padding
      background: 'rgba(21, 25, 33, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{title}</div>
        <div style={{ fontSize: '1.25rem', color: color || 'var(--bg-accent)', display: 'flex', alignItems: 'center' }}>{icon}</div>
      </div>
      
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>₹{value.toLocaleString()}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
        {trend ? (
          <span style={{ color: isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isPositive ? <FiTrendingUp fontSize="0.9rem" /> : <FiTrendingDown fontSize="0.9rem" />}
            {trend}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
             {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;