import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const getTokenExpirationTime = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    return exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const countdownToastId = useRef<string | null>(null);
  const countdownInterval = useRef<number | null>(null);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const expirationTime = getTokenExpirationTime(token);
      if (!expirationTime) return;

      const timeUntilExpiration = expirationTime - Date.now();
      
      // If token is expired, logout immediately
      if (timeUntilExpiration <= 0) {
        // Clear any existing countdown
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        if (countdownToastId.current) {
          toast.dismiss(countdownToastId.current);
          countdownToastId.current = null;
        }

        // Clear user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page and reload to clear any stale state
        navigate('/');
        window.location.reload();
        return;
      }

      // If less than 10 seconds until expiration and no countdown is active
      if (timeUntilExpiration <= 10000 && !countdownToastId.current) {
        let secondsLeft = Math.ceil(timeUntilExpiration / 1000);
        
        // Create a unique ID for this countdown session
        const toastId = `countdown-${Date.now()}`;
        countdownToastId.current = toastId;
        
        // Show initial countdown toast
        toast(
          `Your session will expire in ${secondsLeft} seconds. Please save your work.`,
          {
            id: toastId,
            duration: Infinity,
            position: 'top-center',
            style: {
              background: '#ff4444',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
          }
        );

        // Update countdown every second
        countdownInterval.current = setInterval(() => {
          secondsLeft--;
          if (secondsLeft <= 0) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
              countdownInterval.current = null;
            }
            if (countdownToastId.current) {
              toast.dismiss(countdownToastId.current);
              countdownToastId.current = null;
            }
            return;
          }

          // Update the toast message using the same ID
          toast(
            `Your session will expire in ${secondsLeft} seconds. Please save your work.`,
            {
              id: toastId,
              duration: Infinity,
              position: 'top-center',
              style: {
                background: '#ff4444',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
            }
          );
        }, 1000);
      }
    };

    // Initial check
    checkTokenExpiration();

    // Set up periodic check every second
    const intervalId = setInterval(checkTokenExpiration, 1000);

    // Cleanup interval and toast on unmount
    return () => {
      clearInterval(intervalId);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (countdownToastId.current) {
        toast.dismiss(countdownToastId.current);
        countdownToastId.current = null;
      }
    };
  }, [navigate]);
}; 