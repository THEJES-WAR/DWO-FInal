import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={20} color="#10B981" />,
  info: <Info size={20} color="#3B82F6" />,
  action: <AlertTriangle size={20} color="#F59E0B" />,
  urgent: <AlertCircle size={20} color="#EF4444" />
};

const BORDERS = {
  success: '#34D399',
  info: '#93C5FD',
  action: '#FCD34D',
  urgent: '#FCA5A5'
};

const BGS = {
  success: '#ECFDF5',
  info: '#EFF6FF',
  action: '#FFFBEB',
  urgent: '#FEF2F2'
};

const ToastItem = ({ toast }) => {
  const { removeToast } = useNotifications();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // 5s drain
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - (100 / 50))); // 50 * 100ms = 5000ms
    }, 100);

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [removeToast, toast.id]);

  return (
    <div style={{
      background: BGS[toast.type] || '#FFFFFF',
      border: `1px solid ${BORDERS[toast.type] || '#E2E8F0'}`,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      borderRadius: '8px',
      padding: '16px',
      paddingRight: '40px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      width: '100%',
      pointerEvents: 'auto',
      animation: 'slideDown 0.3s ease-out forwards'
    }}>
      {ICONS[toast.type] || <Info size={20} color="#64748B" />}
      <p style={{ margin: 0, fontSize: '14px', color: '#1E293B', fontWeight: 500, lineHeight: 1.4 }}>
        {toast.message}
      </p>

      {/* Close Button */}
      <button 
        onClick={() => removeToast(toast.id)}
        style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
      >
        <X size={16} />
      </button>

      {/* Progress Bar draining left to right over 10s */}
      <div style={{
          position: 'absolute',
          bottom: 0, left: 0, height: '4px',
          background: BORDERS[toast.type] || '#CBD5E1',
          width: `${progress}%`,
          transition: 'width 0.1s linear'
      }} />
    </div>
  );
};

const ToastManager = () => {
  const { toasts } = useNotifications();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '400px',
      maxWidth: '90vw',
      pointerEvents: 'none'
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
};

export default ToastManager;
