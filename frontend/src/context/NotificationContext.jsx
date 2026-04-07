import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [topBarNotifications, setTopBarNotifications] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    try {
      const res = await fetch('/api/patient/notifications', { headers: { 'x-user': JSON.stringify(user) } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000); // Poll for new notifications
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id && t._id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const newToast = { id: Date.now(), ...toast };
    setToasts(prev => {
      const updated = [...prev, newToast];
      if (updated.length > 3) return updated.slice(updated.length - 3);
      return updated;
    });
    // Also show in top bar
    setTopBarNotifications(prev => [...prev, newToast]);
  }, []);

  const dismissTopBar = useCallback((id) => {
    setTopBarNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const newNote = { id: Date.now(), ...notification };
    setNotifications(prev => [newNote, ...prev]);
    setTopBarNotifications(prev => [...prev, newNote]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
    if (!isDrawerOpen) fetchHistory();
  }, [isDrawerOpen, fetchHistory]);

  return (
    <NotificationContext.Provider value={{
      toasts, addToast, removeToast,
      notifications, setNotifications, addNotification, markAllRead,
      topBarNotifications, dismissTopBar,
      isDrawerOpen, toggleDrawer, setIsDrawerOpen, fetchHistory
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
