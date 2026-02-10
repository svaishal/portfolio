import { useEffect, useRef, useCallback } from 'react';

interface UseAutoLogoutOptions {
  /**
   * Inactivity timeout in milliseconds
   * @default 1800000 (30 minutes)
   */
  inactivityTimeout?: number;
  
  /**
   * Events that reset the inactivity timer
   * @default ['mousedown', 'keydown', 'scroll', 'touchstart']
   */
  resetEvents?: string[];
  
  /**
   * Callback function to execute on auto-logout
   * Should handle the logout API call and redirect
   */
  onLogout: () => Promise<void>;
  
  /**
   * Whether to show confirmation dialog before leaving page
   * @default true
   */
  showExitConfirmation?: boolean;
  
  /**
   * Whether to trigger logout on tab close/navigation
   * @default true
   */
  logoutOnUnload?: boolean;
}

/**
 * Custom hook to handle automatic logout scenarios:
 * - Inactivity timeout (30 minutes by default)
 * - Tab close/navigation
 * - Browser close
 */
export function useAutoLogout({
  inactivityTimeout = 30 * 60 * 1000, // 30 minutes
  resetEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'],
  onLogout,
  showExitConfirmation = true,
  logoutOnUnload = true,
}: UseAutoLogoutOptions) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOut = useRef(false);

  // Logout function with debouncing to prevent multiple calls
  const executeLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    
    isLoggingOut.current = true;
    try {
      await onLogout();
    } catch (error) {
      console.error('Auto-logout failed:', error);
    } finally {
      isLoggingOut.current = false;
    }
  }, [onLogout]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // Set new timeout
    timeoutId.current = setTimeout(() => {
      console.log('[Auto-logout] Inactivity timeout reached');
      executeLogout();
    }, inactivityTimeout);
  }, [inactivityTimeout, executeLogout]);

  // Setup inactivity timer
  useEffect(() => {
    // Initialize timer on mount
    resetTimer();

    // Add event listeners to reset timer on activity
    resetEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup on unmount
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      
      resetEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, resetEvents]);

  // Handle tab close / browser close / navigation
  useEffect(() => {
    if (!logoutOnUnload) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showExitConfirmation) {
        // Modern browsers ignore custom messages, but we still prevent default
        e.preventDefault();
        e.returnValue = '';
      }

      // Trigger logout using navigator.sendBeacon for reliability
      // This works even when the page is being closed
      const logoutUrl = '/api/auth/logout';
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
      navigator.sendBeacon(logoutUrl, blob);
    };

    const handleVisibilityChange = () => {
      // Optionally logout when tab is hidden for extended period
      // For now, we just reset the timer when tab becomes visible again
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logoutOnUnload, showExitConfirmation, resetTimer]);

  return {
    /**
     * Manually reset the inactivity timer
     * Useful for resetting after major user actions
     */
    resetTimer,
    
    /**
     * Manually trigger logout
     */
    logout: executeLogout,
  };
}
