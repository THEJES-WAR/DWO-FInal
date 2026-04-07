import React, { useState, useEffect, useRef } from 'react';
import { Bell, Send, X, Clock, AlertTriangle, CheckCircle2, RefreshCw, Activity, ChevronRight, Loader } from 'lucide-react';

/* ─── Status → badge ─── */
const statusMeta = (status) => {
  const m = {
    'registered':        { label: 'Registered',       bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
    'pending_vitals':    { label: 'Pending Vitals',    bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    'vitals_scheduled':  { label: 'Vitals Scheduled',  bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    'vitals_collected':  { label: 'Vitals Done',       bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    'doctor_pending':    { label: 'With Doctor',       bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
    'billing_pending':   { label: 'Billing',           bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    'pharmacy_pending':  { label: 'Pharmacy',          bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    'payment_completed': { label: 'Payment Done',      bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    'discharged':        { label: 'Discharged',        bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  };
  return m[status] || { label: status, bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
};

/* ─── Stage pipeline display ─── */
const PIPELINE = [
  'registered', 'pending_vitals', 'vitals_collected', 'doctor_pending',
  'billing_pending', 'payment_completed', 'discharged'
];

const AdminWorkflow = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [search, setSearch]     = useState('');
  const [reminderTarget, setReminderTarget] = useState(null); // { patientId, patientName, role, targetId, targetName }
  const [reminderMsg, setReminderMsg]       = useState('');
  const [sending, setSending]   = useState(false);
  const [toasts, setToasts]     = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    fetchPatients();
    const t = setInterval(fetchPatients, 3000);
    return () => clearInterval(t);
  }, []);

  const fetchPatients = async () => {
    try {
      const freshUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch('http://localhost:5000/api/admin-new/live-patients', {
        headers: { 'x-user': JSON.stringify(freshUser) }
      });
      if (res.ok) { setPatients(await res.json()); setLastSync(new Date()); }
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
      const res = await fetch('http://localhost:5000/api/admin-new/remind', {
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
        addToast(`Reminder sent to ${reminderTarget.targetName}`);
        setReminderTarget(null);
        setReminderMsg('');
      } else {
        addToast('Failed to send reminder', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    finally { setSending(false); }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.issue?.description || '').toLowerCase().includes(search.toLowerCase())
  );

  /* stage counts */
  const stageCounts = PIPELINE.reduce((acc, s) => {
    acc[s] = patients.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>

      {/* Toast stack */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${t.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: t.type === 'error' ? '#DC2626' : '#166534', padding: '14px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'slideIn 0.3s ease' }}>
            <Bell size={15} /> {t.msg}
          </div>
        ))}
      </div>

      {/* Reminder Modal */}
      {reminderTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '36px', width: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Send Reminder</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>This will appear as a 5-second notification on their portal</p>
              </div>
              <button onClick={() => setReminderTarget(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {/* Recipient info */}
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Sending to</div>
              <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{reminderTarget.targetName}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Role: {reminderTarget.role} · For patient: <strong>{reminderTarget.patientName}</strong></div>
            </div>

            <textarea
              value={reminderMsg} onChange={e => setReminderMsg(e.target.value)}
              placeholder="Type your reminder message…"
              rows={4}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '14px', fontWeight: 500, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />

            {/* Quick messages */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {[
                'Please attend to the patient immediately.',
                'Patient vitals need to be checked now.',
                'Prescription is ready for review.',
                'Please expedite the discharge process.',
              ].map(q => (
                <button key={q} onClick={() => setReminderMsg(q)}
                  style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '11px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>

            <button
              onClick={sendReminder}
              disabled={sending || !reminderMsg.trim()}
              style={{ width: '100%', marginTop: '20px', padding: '14px', background: !reminderMsg.trim() ? '#E2E8F0' : '#6366F1', color: !reminderMsg.trim() ? '#94A3B8' : 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: !reminderMsg.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {sending ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {sending ? 'Sending…' : 'Send Reminder Now'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>Live Patient Workflow</h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>
            {patients.length} active patients · Auto-refreshes every 3s
            {lastSync && <span style={{ marginLeft: '8px', color: '#10B981' }}>· Last sync: {lastSync.toLocaleTimeString()}</span>}
          </p>
        </div>
        <input
          type="text" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '13px', width: '220px', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* Pipeline funnel */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px 24px', border: '1px solid #E2E8F0', display: 'flex', gap: '0', overflowX: 'auto' }}>
        {PIPELINE.filter(s => s !== 'discharged').map((s, i) => {
          const meta = statusMeta(s);
          const count = stageCounts[s] || 0;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '80px' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: count > 0 ? meta.color : '#CBD5E1' }}>{count}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px', lineHeight: 1.3 }}>{meta.label}</div>
              </div>
              {i < PIPELINE.length - 2 && <ChevronRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {/* Patient Cards */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: '#64748B' }}>
          <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 600 }}>Loading patient data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
          <Activity size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontWeight: 600 }}>No active patients at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(p => {
            const meta = statusMeta(p.status);
            const currentStageIdx = PIPELINE.indexOf(p.status);
            return (
              <div key={p.id} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px 24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                
                {/* Avatar */}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', flexShrink: 0 }}>
                  {p.name.charAt(0)}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B' }}>{p.name}</span>
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                    {p.status === 'billing_pending' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#DC2626' }}><AlertTriangle size={12} /> Needs Attention</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                    {p.issue?.description ? `Issue: ${p.issue.description.substring(0, 60)}…` : 'No issue recorded'}
                    {p.assignedDoctor && <span style={{ marginLeft: '12px' }}>| Dr. {p.assignedDoctor.name} ({p.assignedDoctor.specialization})</span>}
                  </div>
                </div>

                {/* Mini pipeline */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {PIPELINE.slice(0, -1).map((s, i) => (
                    <div key={s} title={statusMeta(s).label} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: i < currentStageIdx ? '#10B981' : i === currentStageIdx ? meta.color : '#E2E8F0',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {p.assignedNurse && (
                    <button
                      onClick={() => { setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Nurse', targetId: p.assignedNurse.id, targetName: p.assignedNurse.name }); setReminderMsg(`Reminder: Patient ${p.name} needs immediate attention.`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EDE9FE'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF'; }}
                    >
                      <Bell size={12} /> Remind Nurse
                    </button>
                  )}
                  {p.assignedDoctor && (
                    <button
                      onClick={() => { setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Doctor', targetId: p.assignedDoctor.id, targetName: p.assignedDoctor.name }); setReminderMsg(`Admin Reminder: Patient ${p.name} requires your attention.`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                    >
                      <Bell size={12} /> Remind Doctor
                    </button>
                  )}
                  <button
                    onClick={() => { setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Patient', targetId: p.id, targetName: p.name }); setReminderMsg(`Admin reminder: Please check your portal for updates regarding your visit.`); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; }}
                  >
                    <Bell size={12} /> Remind Patient
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default AdminWorkflow;
