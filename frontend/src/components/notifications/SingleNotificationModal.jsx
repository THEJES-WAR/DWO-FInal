import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, Bell, Clock, User, CheckCircle } from 'lucide-react';

const SingleNotificationModal = () => {
    const { selectedNotification, setSelectedNotification } = useNotifications();

    if (!selectedNotification) return null;

    const n = selectedNotification;
    const time = new Date(n.createdAt || Date.now()).toLocaleString([], { 
        weekday: 'short', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedNotification(null)}>
            <div style={{
                background: '#FFFFFF',
                width: '100%', maxWidth: '500px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }} onClick={e => e.stopPropagation()}>
                
                {/* Header Area */}
                <div style={{ 
                    padding: '32px 32px 24px', 
                    background: 'linear-gradient(to bottom right, #F8FAFC, #FFFFFF)',
                    borderBottom: '1px solid #F1F5F9',
                    position: 'relative'
                }}>
                    <button 
                        onClick={() => setSelectedNotification(null)}
                        style={{ 
                            position: 'absolute', top: '24px', right: '24px', 
                            background: '#F1F5F9', border: 'none', borderRadius: '12px', 
                            padding: '8px', cursor: 'pointer', color: '#64748B' 
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                            width: '48px', height: '48px', borderRadius: '16px', 
                            background: '#EEF2FF', color: '#6366F1', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>New Message</h2>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {n.type?.replace(/_/g, ' ') || 'Notification'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                            <User size={16} color="#94A3B8" />
                            <span>From: <strong style={{ color: '#1E293B' }}>{n.senderName || 'MedPlus Admin'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                            <Clock size={16} color="#94A3B8" />
                            <span>{time}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '32px' }}>
                    <div style={{ 
                        fontSize: '16px', lineHeight: 1.6, color: '#334155', 
                        fontWeight: 500, whiteSpace: 'pre-wrap' 
                    }}>
                        {n.message}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px 32px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={() => setSelectedNotification(null)}
                        style={{ 
                            background: '#1E293B', color: 'white', 
                            padding: '12px 24px', borderRadius: '14px', 
                            border: 'none', fontSize: '14px', fontWeight: 700, 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <CheckCircle size={18} />
                        Mark as Read & Close
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { 
                    from { transform: translateY(20px); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }
            `}</style>
        </div>
    );
};

export default SingleNotificationModal;
