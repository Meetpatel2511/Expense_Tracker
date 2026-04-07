import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiPlusCircle, FiPieChart, FiUsers, FiTrendingUp, FiHelpCircle, FiX } from "react-icons/fi";
import UpgradeModal from "./UpgradeModal";
import API from "../utils/api";
import { usePro } from "../context/ProContext";

const navItems = [
  { path: "/", icon: <FiGrid />, label: "Dashboard" },
  { path: "/expenses", icon: <FiPlusCircle />, label: "Add Expense" },
  { path: "/income", icon: <FiTrendingUp />, label: "Add Income" },
  { path: "/budget", icon: <FiPieChart />, label: "Budget" },
  { path: "/family", icon: <FiUsers />, label: "Family" },
];

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useUser();
  const { isPro, refreshProStatus } = usePro();
  const [showModal, setShowModal] = useState(false);

  const handleUpgrade = async () => {
    try {
      // Simulation mode: sends a dummy ID to satisfy backend requirement
      const payload = { paymentId: "SIMULATED_PRO_PAYMENT" }; 

      const res = await API.post("/user/upgrade-pro", payload);
      if (res.data.isPro) {
        await refreshProStatus();
        setShowModal(false);
        alert("🎉 You are now a Pro user! All features unlocked.");
      }
    } catch (err) {
      alert("Upgrade failed. Please try again.");
      console.error("Upgrade error:", err);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Mobile Close Button */}
      <button 
        className="mobile-only" 
        onClick={toggleSidebar}
        style={{ 
          position: 'absolute', 
          top: '24px', 
          right: '16px', 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-secondary)',
          display: 'none',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        <FiX size={24} />
      </button>

      {/* Logo */}
      <NavLink 
        to="/"
        className="sidebar-logo" 
        style={{ 
            fontSize: '1.5rem', 
            textDecoration: 'none', 
            fontWeight: 800, 
            color: 'var(--bg-accent)', 
            marginBottom: '40px', 
            display: 'block' 
        }}
      >
        FinTrack
      </NavLink>

      {/* User Profile Section - Integrated with NavLink and Hover System */}
      <NavLink 
        to="/profile" 
        className="sidebar-user" 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}
      >
        <div className="sidebar-user-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={user?.imageUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Hi, {user?.firstName || "User"} 👋</div>
          <div 
            style={{ 
              fontSize: '0.75rem', 
              color: isPro ? '#a78bfa' : 'var(--text-muted)', 
              fontWeight: isPro ? 700 : 500
            }}
          >
             {isPro ? "Pro Member 💎" : "Regular Member"}
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="nav-item"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'var(--transition)',
              backgroundColor: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: isActive ? 'var(--bg-accent)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500
            })}
          >
            <div style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ fontSize: '0.95rem' }}>{item.label}</div>
          </NavLink>
        ))}
      </nav>

      {/* Upgrade Card (Hide if already Pro) */}
      {!isPro && (
        <div className="upgrade-card" style={{ 
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', 
            borderRadius: '16px', 
            padding: '20px', 
            marginBottom: '24px',
            position: 'relative'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: '#fff' }}>Upgrade to Pro</div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '16px', lineHeight: '1.4' }}>
            Unlock AI insights and professional reports.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '10px', 
              border: 'none', 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      )}

      {/* Help Center */}
      <NavLink 
        to="/help"
        style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '16px', padding: '0 16px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0 }}
      >
        <FiHelpCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
        <span>Help Center</span>
      </NavLink>

      {/* Render Modal */}
      {showModal && (
        <UpgradeModal 
          onClose={() => setShowModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: block !important; }
          .sidebar-logo { margin-bottom: 24px !important; }
        }
      `}</style>
    </aside>
  );
}

export default Sidebar;