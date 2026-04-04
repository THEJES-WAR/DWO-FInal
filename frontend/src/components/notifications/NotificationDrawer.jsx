import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, Check } from 'lucide-react';

const NotificationDrawer = () => {
    const { notifications, isDrawerOpen, toggleDrawer, markAllRead } = useNotifications();

    if (!isDrawerOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '400px', maxWidth: '100vw',
            background: '#FFFFFF',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
            zIndex: 9998,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out forwards',
            borderLeft: '1px solid #E2E8F0'
        }}>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1E293B' }}>Notifications</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={16} /> Mark all read
                    </button>
                    <button onClick={toggleDrawer} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '40px', fontWeight: 500 }}>
                        No notifications yet.
                    </div>
                ) : notifications.map(n => (
                    <div key={n._id || Math.random()} style={{
                        padding: '16px', borderRadius: '12px',
                        background: n.read ? '#F8FAFC' : '#EFF6FF',
                        borderLeft: `4px solid ${n.read ? '#CBD5E1' : '#3B82F6'}`,
                        cursor: 'pointer'
                    }} onClick={toggleDrawer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: n.read ? '#64748B' : '#1D4ED8', textTransform: 'capitalize' }}>
                                {n.type.replace(/_/g, ' ')}
                            </span>
                            {!n.read && <span style={{ width: '8px', height: '8px', background: '#3B82F6', borderRadius: '50%' }} />}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5, fontWeight: n.read ? 400 : 500 }}>
                            {n.message}
                        </p>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                            {new Date(n.createdAt).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationDrawer;
