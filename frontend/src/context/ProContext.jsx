import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import API from "../utils/api";
import { useAuth } from "@clerk/clerk-react";

const ProContext = createContext({
  isPro: false,
  plan: null,
  proSince: null,
  proStartsAt: null,
  proExpiresAt: null,
  isProActive: false,
  loading: true,
  refreshProStatus: () => {}
});

export const ProProvider = ({ children }) => {
  const [proData, setProData] = useState({
    isPro: false,
    plan: null,
    proSince: null,
    proStartsAt: null,
    proExpiresAt: null,
    loading: true
  });
  const { isSignedIn } = useAuth();

  const fetchProStatus = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const res = await API.get("/user/pro-status");
      const { isPro, plan, proSince, proStartsAt, proExpiresAt } = res.data;
      setProData({
        isPro: Boolean(isPro),
        plan: plan || null,
        proSince: proSince || null,
        proStartsAt: proStartsAt || null,
        proExpiresAt: proExpiresAt || null,
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
      setProData({
        isPro: false,
        plan: null,
        proSince: null,
        proStartsAt: null,
        proExpiresAt: null,
        loading: false
      });
    }
  }, [isSignedIn, fetchProStatus]);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!proData.proExpiresAt) return;
    const expiryTime = new Date(proData.proExpiresAt).getTime();
    if (isNaN(expiryTime) || expiryTime <= Date.now()) return;

    // Set a timeout for the exact moment the subscription expires
    const delay = Math.max(1000, expiryTime - Date.now());
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
      fetchProStatus();
    }, delay);

    return () => clearTimeout(timer);
  }, [proData.proExpiresAt, fetchProStatus]);

  // Derived active status helper: true if isPro is true AND (legacy with no expiry OR expiry is in future)
  const isProActive = useMemo(() => {
    if (!proData.isPro) return false;
    if (!proData.proExpiresAt) return true; // Legacy Pro compatibility
    return new Date(proData.proExpiresAt).getTime() > currentTime;
  }, [proData.isPro, proData.proExpiresAt, currentTime]);

  const value = {
    ...proData,
    isPro: isProActive, // Guarantees all isPro consumers receive strictly active subscription status
    rawIsPro: proData.isPro,
    isProActive,
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
