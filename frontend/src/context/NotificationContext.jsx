import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auto-dismiss logic for toasts (10 seconds)
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1)); // Remove oldest
    }, 10000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const addToast = useCallback((toast) => {
    const newToast = { id: Date.now(), ...toast };
    setToasts(prev => {
      const updated = [...prev, newToast];
      // Max 3 stacked — oldest dismisses when 4th arrives
      if (updated.length > 3) return updated.slice(updated.length - 3);
      return updated;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  return (
    <NotificationContext.Provider value={{
      toasts, addToast, removeToast,
      notifications, setNotifications, addNotification, markAllRead,
      isDrawerOpen, toggleDrawer, setIsDrawerOpen
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
