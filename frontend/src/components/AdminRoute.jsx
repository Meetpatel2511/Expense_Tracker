import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          minHeight: "60vh",
          gap: "16px",
          color: "var(--text-secondary)"
        }}
      >
        <div 
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(124, 58, 237, 0.2)",
            borderTopColor: "var(--bg-accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }}
        />
        <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>Verifying administrator privileges...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

export default AdminRoute;
