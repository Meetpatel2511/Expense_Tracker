import React from "react";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

function StatCard({ title, value, subtext, icon, trend, color = "var(--bg-accent)" }) {
  const isPositive = typeof trend === 'number' ? trend > 0 : trend?.toString().startsWith('+');

  return (
    <div 
      className="card" 
      style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px',
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.6px' }}>
          {title}
        </div>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '10px', 
          background: `${color}18`, 
          color: color, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
        ₹{Number(value || 0).toLocaleString()}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
        {trend ? (
          <span 
            className={`badge ${isPositive ? "badge-success" : "badge-danger"}`}
            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
          >
            {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            {trend}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;