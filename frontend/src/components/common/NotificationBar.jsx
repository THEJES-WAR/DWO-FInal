import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const NotificationBar = ({ notifications, onDismiss }) => {
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[notifications.length - 1];
            setCurrent(latest);
            
            const timer = setTimeout(() => {
                setCurrent(null);
                onDismiss(latest.id || latest._id);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [notifications, onDismiss]);

    if (!current) return null;

    const colors = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B'
    };

    const icons = {
        success: <CheckCircle2 size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
        warning: <Bell size={18} />
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: '320px',
            maxWidth: '500px',
            background: 'white',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: `6px solid ${colors[current.type || 'info']}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.3s ease-out'
        }}>
            <style>
                {`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                `}
            </style>
            <div style={{ color: colors[current.type || 'info'] }}>
                {icons[current.type || 'info']}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>
                    {current.senderName || 'Notification'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                    {current.message}
                </div>
            </div>
            <button 
                onClick={() => { setCurrent(null); onDismiss(current.id || current._id); }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default NotificationBar;
