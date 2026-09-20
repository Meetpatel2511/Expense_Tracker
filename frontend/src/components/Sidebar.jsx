import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiPlusCircle, FiPieChart, FiUsers, FiTrendingUp, FiHelpCircle, FiX, FiShield, FiStar } from "react-icons/fi";
import UpgradeModal from "./UpgradeModal";
import BrandLogo from "./BrandLogo";
import { usePro } from "../context/ProContext";
import { useAdmin } from "../context/AdminContext";

const navItems = [
  { path: "/dashboard", icon: <FiGrid />, label: "Dashboard" },
  { path: "/expenses", icon: <FiPlusCircle />, label: "Add Expense" },
  { path: "/income", icon: <FiTrendingUp />, label: "Add Income" },
  { path: "/budget", icon: <FiPieChart />, label: "Budget" },
  { path: "/family", icon: <FiUsers />, label: "Family" },
];

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useUser();
  const { isPro, refreshProStatus } = usePro();
  const { isAdmin } = useAdmin();
  const [showModal, setShowModal] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Mobile Close Button */}
      <button 
        className="mobile-only" 
        onClick={toggleSidebar}
        aria-label="Close Sidebar"
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '16px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        <FiX size={18} />
      </button>

      {/* Logo */}
      <div style={{ marginBottom: '32px', padding: '0 4px' }}>
        <BrandLogo variant="navbar" to="/dashboard" />
      </div>

      {/* User Profile Section */}
      <NavLink 
        to="/profile" 
        className="sidebar-user" 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}
      >
        <div className="sidebar-user-avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={user?.imageUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Hi, {user?.firstName || "User"} 👋
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span 
              className={`badge ${isPro ? "badge-pro" : "badge-neutral"}`}
              style={{ fontSize: '0.65rem', padding: '2px 8px' }}
            >
              {isPro ? "Pro Member 💎" : "Free Member"}
            </span>
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="nav-item"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '11px 14px',
              borderRadius: '12px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'var(--transition)',
              backgroundColor: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: isActive ? '#c4b5fd' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              border: isActive ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent'
            })}
          >
            <div style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ fontSize: '0.9rem' }}>{item.label}</div>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className="nav-item"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '11px 14px',
              borderRadius: '12px',
              marginTop: '4px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'var(--transition)',
              backgroundColor: isActive ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.02)',
              color: isActive ? '#c4b5fd' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              border: '1px solid rgba(124, 58, 237, 0.25)'
            })}
          >
            <div style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--bg-accent)' }}>
              <FiShield />
            </div>
            <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Admin Portal</span>
              <span className="badge badge-pro" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                Admin
              </span>
            </div>
          </NavLink>
        )}
      </nav>

      {/* Upgrade Card (Hide if already Pro) */}
      {!isPro && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)', 
          border: '1px solid rgba(124, 58, 237, 0.35)',
          borderRadius: '16px', 
          padding: '18px 16px', 
          marginBottom: '20px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: '#fbbf24', fontSize: '1rem', display: 'flex' }}><FiStar /></span>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.5px' }}>
              FinTrack Pro
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
            Unlock Smart Alerts, unlimited family members & executive PDF reports.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="upgrade-btn-small"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Help Center */}
      <NavLink 
        to="/help"
        style={({ isActive }) => ({
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none', 
          gap: '12px', 
          padding: '10px 14px', 
          color: isActive ? '#c4b5fd' : 'var(--text-secondary)', 
          cursor: 'pointer', 
          fontSize: '0.9rem',
          fontWeight: isActive ? 700 : 500,
          borderRadius: '10px',
          background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
          flexShrink: 0 
        })}
      >
        <FiHelpCircle style={{ fontSize: '1.15rem', flexShrink: 0 }} />
        <span>Help & Support</span>
      </NavLink>

      {/* Render Modal */}
      {showModal && (
        <UpgradeModal 
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </aside>
  );
}

export default Sidebar;