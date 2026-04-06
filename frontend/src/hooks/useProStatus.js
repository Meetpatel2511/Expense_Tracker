import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import API from "../utils/api";

export const useProStatus = () => {
  const { user } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/user/pro-status");
      setIsPro(res.data.isPro || false);
    } catch (err) {
      console.warn("Failed to fetch Pro status:", err.message);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProStatus();
  }, [fetchProStatus]);

  // Allow components to force a refresh after upgrade
  const refreshProStatus = useCallback(() => {
    setLoading(true);
    fetchProStatus();
  }, [fetchProStatus]);

  return { isPro, loading, refreshProStatus };
};
