import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import { useAuth } from "@clerk/clerk-react";

const AdminContext = createContext({
  isAdmin: false,
  adminUser: null,
  loading: true,
  error: null,
  refreshAdminStatus: () => {}
});

export const AdminProvider = ({ children }) => {
  const [adminState, setAdminState] = useState({
    isAdmin: false,
    adminUser: null,
    loading: true,
    error: null
  });

  const { isSignedIn } = useAuth();

  const fetchAdminStatus = useCallback(async () => {
    if (!isSignedIn) {
      setAdminState({
        isAdmin: false,
        adminUser: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      const res = await API.get("/admin/me");
      if (res.data && res.data.isAdmin === true) {
        setAdminState({
          isAdmin: true,
          adminUser: res.data.user || null,
          loading: false,
          error: null
        });
      } else {
        setAdminState({
          isAdmin: false,
          adminUser: null,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      // 403 or 401 means user is not an admin, not an unhandled crash
      const isExpectedAuthRejection = err.response && (err.response.status === 403 || err.response.status === 401);
      setAdminState({
        isAdmin: false,
        adminUser: null,
        loading: false,
        error: isExpectedAuthRejection ? null : (err.response?.data?.message || "Failed to verify admin status.")
      });
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);

  const value = {
    ...adminState,
    refreshAdminStatus: fetchAdminStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export default AdminContext;
