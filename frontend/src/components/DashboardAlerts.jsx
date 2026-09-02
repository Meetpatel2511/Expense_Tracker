import React from "react";
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiInfo, 
  FiAlertCircle, 
  FiPieChart, 
  FiZap 
} from "react-icons/fi";

function DashboardAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  // Icons mapper for specific alert types
  const getIcon = (iconName, type) => {
    switch (iconName) {
      case "FiAlertCircle": return <FiAlertCircle />;
      case "FiAlertTriangle": return <FiAlertTriangle />;
      case "FiCheckCircle": return <FiCheckCircle />;
      case "FiPieChart": return <FiPieChart />;
      case "FiZap": return <FiZap />;
      case "FiInfo":
      default: return <FiInfo />;
    }
  };

  // Limit to top 3 for clean UX
  const displayAlerts = alerts.slice(0, 3);

  return (
    <div className="alerts-container">
      {displayAlerts.map((alert, index) => {
        // Map types to premium CSS classes
        const alertClass = alert.type || 'info';

        return (
          <div 
            key={index} 
            className={`alert-item alert-${alertClass} animate-fade-in`}
            style={{ 
               animationDelay: `${index * 150}ms`,
               display: 'flex',
               alignItems: 'center',
               gap: '16px',
               padding: '16px 20px',
               borderRadius: '16px',
               marginBottom: '12px',
               background: 'rgba(255, 255, 255, 0.03)',
               border: '1px solid rgba(255, 255, 255, 0.06)',
               transition: 'all 0.3s ease'
            }}
          >
            <div className={`alert-icon-wrapper icon-${alertClass}`} style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
            }}>
              {getIcon(alert.icon, alert.type)}
            </div>
            <div className="alert-text" style={{ 
                fontSize: '0.9rem', 
                fontWeight: 500, 
                lineHeight: 1.5,
                color: 'var(--text-primary)'
            }}>
              {alert.text}
            </div>
          </div>
        );
      })}

      <style>{`
        .alert-danger .alert-icon-wrapper { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .alert-warning .alert-icon-wrapper { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .alert-success .alert-icon-wrapper { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .alert-info .alert-icon-wrapper { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .alert-item:hover {
            transform: scale(1.02);
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}

export default DashboardAlerts;
