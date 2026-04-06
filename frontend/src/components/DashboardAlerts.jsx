import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiTrendingUp, FiAlertCircle } from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineLightBulb } from "react-icons/hi2";

function DashboardAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const getIcon = (iconName, isAi) => {
    if (isAi) return <HiOutlineSparkles />;
    
    switch (iconName) {
      case "FiAlertOctagon": 
      case "FiAlertCircle": 
        return <FiAlertCircle />;
      case "FiAlertTriangle": 
        return <FiAlertTriangle />;
      case "FiCheckCircle": 
        return <FiCheckCircle />;
      case "FiTrendingUp": 
        return <FiTrendingUp />;
      case "FiInfo": 
        return <HiOutlineLightBulb />;
      default: 
        return <FiInfo />;
    }
  };

  return (
    <div className="alerts-container">
      {alerts.map((alert, index) => {
        // AI-generated insights have longer text and often 'success' or 'info' type
        const isAiInsight = (alert.type === 'success' || alert.type === 'info') && alert.text.length > 30;
        const alertClass = isAiInsight ? 'ai-insight' : alert.type;

        return (
          <div key={index} className={`alert-item ${alertClass}`}>
            <div className="alert-icon">
              {getIcon(alert.icon, isAiInsight)}
            </div>
            <div className="alert-text">{alert.text}</div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardAlerts;
