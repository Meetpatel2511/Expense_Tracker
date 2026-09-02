import { useEffect, useCallback, useRef } from "react";
import { useClerk } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const TIMEOUT_DURATION = 25 * 60 * 1000; // 25 minutes
const WARNING_DURATION = 20 * 60 * 1000; // 20 minutes (Show warning at this point)

export const useSessionTimeout = () => {
  const { signOut } = useClerk();
  const warningToastId = useRef(null);
  const timeoutTimer = useRef(null);
  const warningTimer = useRef(null);

  const logout = useCallback(() => {
    sessionStorage.clear();
    signOut();
    toast.error("Session expired due to inactivity. Please log in again.", { id: "session-expired" });
  }, [signOut]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    
    // Dismiss warning toast if it exists
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }

    // Set new activity timestamp
    sessionStorage.setItem("lastActivity", Date.now().toString());

    // Set warning timer
    warningTimer.current = setTimeout(() => {
      warningToastId.current = toast.error(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Session Expiring Soon</span>
            <span style={{ fontSize: '0.8rem' }}>You've been inactive for a while. You'll be logged out in 5 minutes.</span>
            <button 
              onClick={() => { toast.dismiss(t.id); resetTimers(); }}
              style={{ 
                background: 'var(--bg-accent)', 
                color: '#fff', 
                border: 'none', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Continue Session
            </button>
          </div>
        ),
        { duration: Infinity, position: "top-center" }
      );
    }, WARNING_DURATION);

    // Set logout timer
    timeoutTimer.current = setTimeout(logout, TIMEOUT_DURATION);
  }, [logout]);

  useEffect(() => {
    // Check if we should already be logged out (useful for browser/tab re-open)
    const lastActivity = sessionStorage.getItem("lastActivity");
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity);
      if (elapsed >= TIMEOUT_DURATION) {
        logout();
        return;
      }
    }

    // Event listeners for activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    
    // Initial timer set
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [resetTimers, logout]);

  return null;
};
