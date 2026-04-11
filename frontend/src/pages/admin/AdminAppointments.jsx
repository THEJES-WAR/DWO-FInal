import React, { useState, useEffect, useRef } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, Clock, RefreshCw, Bell, User, Stethoscope, Activity, X, Send, Loader } from 'lucide-react';
import { apiUrl } from '../../utils/api';

const STATUS_META = {
  booked:              { label: 'Booked',     bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  completed:           { label: 'Completed',  bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  cancelled:           { label: 'Cancelled',  bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  Cancelled_By_Patient:{ label: 'Cancelled by Patient', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  available:           { label: 'Available',  bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

const AdminAppointments = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('alerts'); // alerts | upcoming | completed | all
  const [search, setSearch]   = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderMsg, setReminderMsg]       = useState('');
  const [sending, setSending]           = useState(false);
  const [toasts, setToasts]             = useState([]);
  const toastId = useRef(0);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAppointments();
    const t = setInterval(fetchAppointments, 10000);
    return () => clearInterval(t);
  }, []);

  const fetchAppointments = async () => {
    try {
      const freshUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(apiUrl('/admin-new/all-appointments'), {
        headers: { 'x-user': JSON.stringify(freshUser) }
      });
      if (res.ok) { setData(await res.json()); setLastSync(new Date()); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addToast = (msg, type = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const sendReminder = async () => {
    if (!reminderMsg.trim() || !reminderTarget) return;
    setSending(true);
    try {
      const freshUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(apiUrl('/admin-new/remind'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(freshUser) },
        body: JSON.stringify({
          patientId: reminderTarget.patientId,
          targetId: reminderTarget.targetId,
          targetRole: reminderTarget.role,
          targetName: reminderTarget.targetName,
          message: reminderMsg,
        })
      });
      if (res.ok) {
        addToast(`✅ Reminder sent to ${reminderTarget.targetName}`);
        setReminderTarget(null); setReminderMsg('');
      } else { addToast('Failed to send reminder', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSending(false); }
  };

  const getList = () => {
    if (!data) return [];
    const base = {
      alerts:    data.alerts || [],
      upcoming:  data.upcoming || [],
      completed: data.completed || [],
      all:       data.all || [],
    }[tab] || [];
    if (!search) return base;
    return base.filter(a =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.staffName.toLowerCase().includes(search.toLowerCase()) ||
      (a.specialization || '').toLowerCase().includes(search.toLowerCase())
    );
  };

  const list = getList();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const tabConfig = [
    { key: 'alerts',    label: '🚨 Missed / Overdue', count: data?.alerts?.length || 0,    color: '#DC2626' },
    { key: 'upcoming',  label: '📅 Upcoming',          count: data?.upcoming?.length || 0,  color: '#2563EB' },
    { key: 'completed', label: '✅ Completed',          count: data?.completed?.length || 0, color: '#16A34A' },
    { key: 'all',       label: '📋 All',                count: data?.total || 0,             color: '#64748B' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${t.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: t.type === 'error' ? '#DC2626' : '#166534', padding: '14px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Reminder Modal */}
      {reminderTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '36px', width: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Send Quick Reminder</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>Notification will appear in their {reminderTarget.role} portal</p>
              </div>
              <button onClick={() => setReminderTarget(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            
            <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="Type your reminder…" rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#EF4444'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            
            <button onClick={sendReminder} disabled={sending || !reminderMsg.trim()}
              style={{ width: '100%', marginTop: '16px', padding: '14px', background: !reminderMsg.trim() ? '#E2E8F0' : '#EF4444', color: !reminderMsg.trim() ? '#94A3B8' : 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: !reminderMsg.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {sending ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Bell size={16} />}
              {sending ? 'Sending…' : `🔔 Remind ${reminderTarget.targetName}`}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Appointments Overview</h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>
            All doctor &amp; nurse appointments from the system
            {lastSync && <span style={{ marginLeft: '8px', color: '#10B981', fontWeight: 600 }}>· {lastSync.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search patient, staff…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', width: '220px' }} />
          <button onClick={fetchAppointments} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {tabConfig.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '18px 20px', borderRadius: '14px', background: tab === t.key ? '#0F172A' : '#FFFFFF', border: `2px solid ${tab === t.key ? '#0F172A' : '#E2E8F0'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: tab === t.key ? '#FFFFFF' : t.color }}>{t.count}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: tab === t.key ? '#94A3B8' : '#64748B', marginTop: '4px' }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Alert banner for missed */}
      {data?.alerts?.length > 0 && tab !== 'alerts' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '14px 20px', borderRadius: '14px' }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontWeight: 700, color: '#DC2626' }}>
            {data.alerts.length} missed/overdue appointment{data.alerts.length > 1 ? 's' : ''}!
          </span>
          <button onClick={() => setTab('alerts')} style={{ marginLeft: 'auto', background: '#DC2626', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            View Alerts
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: '#64748B' }}>
          <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} /> <span style={{ fontWeight: 600 }}>Loading appointments…</span>
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>No appointments in this category.</p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 100px 120px 140px', gap: '0', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {['Date & Time', 'Patient', 'Staff', 'Specialization', 'Status', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {list.map((appt, i) => {
            const sm = STATUS_META[appt.status] || { label: appt.status, bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
            const isAlert = appt.isMissed || appt.isOverdue;
            return (
              <div key={appt.id || i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 100px 120px 140px',
                gap: '0', padding: '14px 20px', alignItems: 'center',
                borderBottom: '1px solid #F1F5F9',
                background: isAlert ? '#FFF5F5' : 'white',
                transition: 'background 0.15s'
              }}
              >
                {/* Date */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isAlert && <AlertTriangle size={13} color="#DC2626" />}
                    <span style={{ fontWeight: 700, fontSize: '13px', color: isAlert ? '#DC2626' : '#1E293B' }}>
                      {formatDate(appt.date)}
                    </span>
                    {appt.isToday && <span style={{ padding: '1px 6px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {appt.time}
                  </div>
                </div>

                {/* Patient */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={14} color="#16A34A" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{appt.patientName}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{appt.patientEmail}</div>
                  </div>
                </div>

                {/* Staff */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: appt.staffRole === 'Doctor' ? '#EFF6FF' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Stethoscope size={14} color={appt.staffRole === 'Doctor' ? '#2563EB' : '#7C3AED'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{appt.staffName}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{appt.staffRole}</div>
                  </div>
                </div>

                {/* Specialization */}
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{appt.specialization || '—'}</div>

                {/* Status */}
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                    {sm.label}
                  </span>
                  {isAlert && <div style={{ fontSize: '9px', fontWeight: 800, color: '#DC2626', marginTop: '4px', textTransform: 'uppercase' }}>Overdue</div>}
                </div>

                {/* Actions */}
                <div>
                  {isAlert && !['completed', 'cancelled'].includes(appt.status) && (
                    <button
                      onClick={() => {
                        // Check if we have an ID or just an email
                        const targetId = appt.staffId || appt.patientId || appt.id; 
                        setReminderTarget({ 
                          patientId: appt.patientId, 
                          patientName: appt.patientName, 
                          role: appt.staffRole || 'Doctor', 
                          targetId: targetId, 
                          targetName: (appt.staffEmail ? appt.staffName : appt.patientName)
                        });
                        setReminderMsg(`Overdue Alert: Your appointment with ${appt.patientName} scheduled for ${appt.time} needs immediate attention.`);
                      }}
                      style={{ padding: '6px 10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Bell size={12} /> Remind
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminAppointments;
