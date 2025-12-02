import { useState, useEffect, useRef, useCallback } from 'react';

const useInactivityLogout = (logoutCallback, timeoutMinutes = 60) => {
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef(null);
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

  const logout = useCallback(() => {
    console.log('Auto-logout due to inactivity');
    logoutCallback();
  }, [logoutCallback]);

  const resetTimer = useCallback(() => {
    setIsActive(true);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set timeout for 1 hour (60 minutes)
    timerRef.current = setTimeout(() => {
      setIsActive(false);
      logout();
    }, timeoutMinutes * 60 * 1000);
  }, [logout, timeoutMinutes]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start the timer
    resetTimer();

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity, resetTimer]);

  return { isActive, resetTimer };
};

export default useInactivityLogout;