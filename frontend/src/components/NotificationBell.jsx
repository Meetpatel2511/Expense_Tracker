import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiBell, FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiInfo, FiTrendingUp, FiZap } from "react-icons/fi";
import { usePro } from "../context/ProContext";
import API from "../utils/api";

// Simple hash function to generate stable unique IDs from text
const generateId = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

function NotificationBell() {
  const { isPro, loading: proLoading } = usePro();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (proLoading || !isPro) return;

    try {
      const res = await API.get("/expense/suggestions");
      const rawAlerts = res.data.alerts || [];
      
      // Get already read IDs from localStorage
      const readIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");
      
      // Transform and filter
      const processed = rawAlerts
        .map(alert => ({
          id: generateId(alert.text),
          message: alert.text,
          type: alert.type || "info",
          icon: alert.icon,
          createdAt: new Date().toISOString()
        }))
        .filter(alert => !readIds.includes(alert.id));

      setNotifications(processed);
    } catch (err) {
      // Don't log error if it's just a 403 (unauthorized for non-pro)
      if (err.response?.status !== 403) {
        console.error("Failed to fetch notifications:", err);
      }
    }
  }, [isPro, proLoading]);

  useEffect(() => {
    fetchNotifications();
    
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchNotifications]); // Fixed M5

  const markAsRead = (id) => {
    let readIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");
    if (!readIds.includes(id)) {
      readIds.push(id);
      // M4: Keep only last 100 to prevent infinite growth
      if (readIds.length > 100) readIds = readIds.slice(-100);
      localStorage.setItem("readNotifications", JSON.stringify(readIds));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    let readIds = JSON.parse(localStorage.getItem("readNotifications") || "[]");
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    // M4: Keep only last 100
    if (readIds.length > 100) readIds = readIds.slice(-100);
    localStorage.setItem("readNotifications", JSON.stringify(readIds));
    setNotifications([]);
  };

  const getIcon = (iconName, type) => {
    switch (iconName) {
      case "FiAlertOctagon": return <FiAlertOctagon />;
      case "FiAlertTriangle": return <FiAlertTriangle />;
      case "FiCheckCircle": return <FiCheckCircle />;
      case "FiTrendingUp": return <FiTrendingUp />;
      default: 
        if (type === "error") return <FiAlertOctagon />;
        if (type === "warning") return <FiAlertTriangle />;
        return <FiInfo />;
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button 
        className="header-icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FiBell />
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
            {notifications.length > 0 && (
              <button className="notifications-btn-clear" onClick={clearAll}>
                Clear All
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <FiBell size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`notification-item ${n.type}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="notification-icon">
                    {getIcon(n.icon, n.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{n.message}</p>
                    <p className="notification-time">Just now</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
