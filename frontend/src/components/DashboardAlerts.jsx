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

  const displayAlerts = alerts.slice(0, 4);

  return (
    <div className="alerts-container">
      {displayAlerts.map((alert, index) => {
        const alertType = alert.type || 'info';

        return (
          <div 
            key={index} 
            className={`alert-item ${alertType === 'danger' ? 'error' : alertType}`}
          >
            <div className="alert-icon">
              {getIcon(alert.icon, alert.type)}
            </div>
            <div className="alert-text">
              {alert.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardAlerts;
