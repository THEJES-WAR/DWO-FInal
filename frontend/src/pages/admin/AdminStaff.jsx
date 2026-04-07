import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Award, Activity, Search, RefreshCw, Star, Send, X, Bell, Stethoscope, UserCheck } from 'lucide-react';

const ROLE_COLORS = {
  Doctor: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', accent: '#2563EB' },
  Nurse:  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', accent: '#7C3AED' },
};

const AdminStaff = () => {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderMsg, setReminderMsg]       = useState('');
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('https://dwo-final.onrender.com/api/admin-new/staff', {
        headers: { 'x-user': JSON.stringify(user) }
      });
      if (res.ok) {
        const d = await res.json();
        setStaff([...d.doctors, ...d.nurses]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const sendReminder = async () => {
    if (!reminderMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch('https://dwo-final.onrender.com/api/admin-new/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
        body: JSON.stringify({
          targetId: reminderTarget.id,
          targetRole: reminderTarget.role,
          targetName: reminderTarget.name,
          message: reminderMsg,
        })
      });
      if (res.ok) {
        showToast(`Reminder sent to ${reminderTarget.name}`);
        setReminderTarget(null);
        setReminderMsg('');
      } else {
        showToast('Failed to send reminder', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSending(false); }
  };

  const filteredStaff = staff.filter(s => {
    const matchRole   = filter === 'All' || s.role === filter;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      || (s.specialization || '').toLowerCase().includes(search.toLowerCase())
      || (s.email || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const doctors = staff.filter(s => s.role === 'Doctor');
  const nurses  = staff.filter(s => s.role === 'Nurse');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#64748B' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontWeight: 600 }}>Loading staff directory…</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: "'Inter', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#DC2626' : '#166534', padding: '14px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <Bell size={16} /> {toast.msg}
        </div>
      )}

      {/* Reminder modal */}
      {reminderTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '36px', width: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Send Reminder</h3>
              <button onClick={() => setReminderTarget(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: ROLE_COLORS[reminderTarget.role]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROLE_COLORS[reminderTarget.role]?.accent, fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                {reminderTarget.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>{reminderTarget.name}</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{reminderTarget.specialization} · {reminderTarget.role}</div>
              </div>
            </div>
            <textarea
              value={reminderMsg}
              onChange={e => setReminderMsg(e.target.value)}
              placeholder="Type your reminder message here…"
              rows={4}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '14px', fontWeight: 500, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
            <button
              onClick={sendReminder}
              disabled={sending || !reminderMsg.trim()}
              style={{ width: '100%', marginTop: '16px', padding: '14px', background: !reminderMsg.trim() ? '#E2E8F0' : '#6366F1', color: !reminderMsg.trim() ? '#94A3B8' : 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: !reminderMsg.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <Send size={16} /> {sending ? 'Sending…' : 'Send Reminder'}
            </button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Staff', value: staff.length, color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Doctors', value: doctors.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Nurses', value: nurses.length, color: '#7C3AED', bg: '#F5F3FF' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, padding: '20px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>Hospital Staff Directory</h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>Click "Send Reminder" to notify any staff member directly</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search name, specialty, email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 16px 9px 34px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '13px', width: '240px', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {['All', 'Doctor', 'Nurse'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: filter === f ? '#1E293B' : '#FFFFFF', color: filter === f ? '#FFFFFF' : '#64748B', borderColor: filter === f ? '#1E293B' : '#E2E8F0', transition: 'all 0.2s' }}>{f}</button>
          ))}
          <button onClick={fetchStaff} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
        {filteredStaff.map(s => {
          const clr = ROLE_COLORS[s.role] || ROLE_COLORS.Doctor;
          return (
            <div key={s.id} style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: clr.bg, color: clr.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{s.role === 'Doctor' ? s.name : s.name}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{s.specialization}</p>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: clr.bg, color: clr.accent, border: `1px solid ${clr.border}` }}>
                  {s.role}
                </span>
              </div>

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  <Mail size={13} color="#94A3B8" /> {s.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  <Phone size={13} color="#94A3B8" /> {s.phone}
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#EAB308', fontSize: '13px', fontWeight: 700 }}>
                  <Star size={13} fill="#EAB308" /> 4.8 Rating
                </div>
                <button
                  onClick={() => { setReminderTarget(s); setReminderMsg(`Reminder: Please attend to your pending tasks.`); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#6366F1', border: 'none', color: 'white', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
                >
                  <Bell size={12} /> Send Reminder
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8', fontWeight: 600 }}>
          <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No staff members found matching your criteria.</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminStaff;
