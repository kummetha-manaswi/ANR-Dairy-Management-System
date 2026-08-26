import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

export default function SessionTimeoutHandler() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const token = localStorage.getItem('token');
    if (!token) return;

    // Get timeout limit from localStorage (in minutes), defaulting to 30 minutes
    const timeoutMinutes = parseInt(localStorage.getItem('sessionTimeout') || '30', 10);
    const timeoutMs = timeoutMinutes * 60 * 1000;

    timerRef.current = setTimeout(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      const redirectPath = user && user.role === 'farmer' ? '/farmer/login' : '/admin/login';

      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionTimeout');
      
      // Notify user and redirect
      showToast('Session expired due to inactivity. Please log in again.', 'error');
      navigate(redirectPath);
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [navigate]);

  return null;
}
