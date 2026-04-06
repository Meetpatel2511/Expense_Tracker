import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import { useAuth } from "@clerk/clerk-react";

const ProContext = createContext({
  isPro: false,
  proSince: null,
  loading: true,
  refreshProStatus: () => {}
});

export const ProProvider = ({ children }) => {
  const [proData, setProData] = useState({
    isPro: false,
    proSince: null,
    loading: true
  });
  const { isSignedIn } = useAuth();

  const fetchProStatus = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const res = await API.get("/user/pro-status");
      setProData({
        isPro: res.data.isPro,
        proSince: res.data.proSince,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching pro status:", error);
      setProData(prev => ({ ...prev, loading: false }));
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchProStatus();
    } else {
      setProData({ isPro: false, proSince: null, loading: false });
    }
  }, [isSignedIn, fetchProStatus]);

  const value = {
    ...proData,
    refreshProStatus: fetchProStatus
  };

  return (
    <ProContext.Provider value={value}>
      {children}
    </ProContext.Provider>
  );
};

export const usePro = () => {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return context;
};
