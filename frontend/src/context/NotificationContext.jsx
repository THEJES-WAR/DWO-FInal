import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [topBarNotifications, setTopBarNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    const endpointMap = {
      Doctor:  '/api/doctor/notifications',
      Nurse:   '/api/nurse/notifications',
      Patient: '/api/patient/notifications',
    };
    const endpoint = endpointMap[user.role];
    if (!endpoint) return;
    try {
      const res = await fetch(`https://dwo-final.onrender.com${endpoint}`, { headers: { 'x-user': JSON.stringify(user) } });
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
    const newNote = { 
      id: Date.now(), 
      _id: notification._id || Date.now().toString(),
      read: false, 
      createdAt: new Date(),
      ...notification 
    };
    setNotifications(prev => [newNote, ...prev]);
    setTopBarNotifications(prev => [...prev, newNote]);
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      await fetch(`https://dwo-final.onrender.com/api/patient/notifications/${id}/mark-read`, {
        method: 'PUT',
        headers: { 'x-user': JSON.stringify(user) }
      });
    } catch (err) { console.error(err); }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      await fetch(`https://dwo-final.onrender.com/api/patient/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'x-user': JSON.stringify(user) }
      });
    } catch (err) { console.error(err); }
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
    if (!isDrawerOpen) fetchHistory();
  }, [isDrawerOpen, fetchHistory]);

  const openNotification = useCallback((notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification._id || notification.id);
    }
  }, [markAsRead]);

  return (
    <NotificationContext.Provider value={{
      toasts, addToast, removeToast,
      notifications, setNotifications, addNotification, markAllRead, markAsRead,
      selectedNotification, setSelectedNotification, openNotification,
      topBarNotifications, dismissTopBar,
      isDrawerOpen, toggleDrawer, setIsDrawerOpen, fetchHistory
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
