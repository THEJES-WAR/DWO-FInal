import React, { useState, useEffect, useRef } from 'react';
import { Bell, Send, X, RefreshCw, Activity, ChevronRight, Loader, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

/* ─── Pipeline stages (excluding 'registered' — those are not in workflow yet) ─── */
const PIPELINE = [
  { key: 'pending_vitals',    label: 'Pending Vitals',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'vitals_scheduled',  label: 'Vitals Scheduled',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'vitals_collected',  label: 'Vitals Done',       color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  { key: 'doctor_pending',    label: 'With Doctor',       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'billing_pending',   label: 'Billing',           color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { key: 'pharmacy_pending',  label: 'Pharmacy',          color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  { key: 'payment_completed', label: 'Payment Done',      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { key: 'discharged',        label: 'Discharged',        color: '#94A3B8', bg: '#F1F5F9', border: '#CBD5E1' },
];

const ACTIVE_STAGES = PIPELINE.filter(s => s.key !== 'discharged').map(s => s.key);

const stageMeta = (status) => PIPELINE.find(p => p.key === status) || { label: status, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
const stageIndex = (status) => PIPELINE.findIndex(p => p.key === status);

/* Sort: most urgent (fewest stages done) at top, discharged at bottom */
const sortPatients = (patients) => [...patients].sort((a, b) => {
  if (a.status === 'discharged' && b.status !== 'discharged') return 1;
  if (b.status === 'discharged' && a.status !== 'discharged') return -1;
  const ai = stageIndex(a.status), bi = stageIndex(b.status);
  if (ai !== bi) return ai - bi;
  return new Date(a.createdAt) - new Date(b.createdAt);
});

/* ─── Only patients past symptom submission (nurse assigned, in active pipeline) ─── */
const ACTIVE_STAGES_SET = new Set([
  'pending_vitals', 'vitals_scheduled', 'vitals_collected',
  'doctor_pending', 'billing_pending', 'pharmacy_pending',
  'payment_completed', 'discharged'
]);
/* Check if visit is overdue (Nurse or Doctor) */
const isVisitOverdue = (patient) => {
  const visit = patient.status === 'doctor_pending' ? patient.doctorVisit : patient.nurseVisit;
  if (!visit?.date || !visit?.time) return false;
  const visitTime = new Date(`${visit.date}T${visit.time}:00`);
  return visitTime < new Date();
};

const AdminWorkflow = () => {
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastSync, setLastSync]         = useState(null);
  const [search, setSearch]             = useState('');
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderMsg, setReminderMsg]       = useState('');
  const [sending, setSending]           = useState(false);
  const [toasts, setToasts]             = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async () => {
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
        addToast(`✅ Reminder sent to ${reminderTarget.targetName}`);
        setReminderTarget(null); setReminderMsg('');
      } else { addToast('Failed to send reminder', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSending(false); }
  };

  /* Filter: only patients in known active pipeline stages (nurse assigned + past symptom submission) */
  const workflowPatients = patients.filter(p => ACTIVE_STAGES_SET.has(p.status));
  const sorted = sortPatients(workflowPatients);
  const filtered = sorted.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.issue?.description || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Stage counts (active only — no registered, no discharged) */
  const funnelCounts = PIPELINE.filter(s => s.key !== 'discharged').map(s => ({
    ...s,
    count: workflowPatients.filter(p => p.status === s.key).length
  }));

  const priorityLabel = (status) => {
    const idx = stageIndex(status);
    if (status === 'discharged')  return { text: '✅ Done',           color: '#94A3B8' };
    if (idx <= 1)                 return { text: '🔴 High Priority',  color: '#DC2626' };
    if (idx <= 3)                 return { text: '🟡 Mid Priority',   color: '#D97706' };
    return                               { text: '🟢 Low Priority',   color: '#16A34A' };
  };

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
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Send Reminder</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>5-second notification on their portal + saved to messages</p>
              </div>
              <button onClick={() => setReminderTarget(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <div>
                <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '14px' }}>Overdue: {reminderTarget.targetName}</div>
                <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>Patient: <strong>{reminderTarget.patientName}</strong></div>
              </div>
            </div>
            <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="Type your reminder…" rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#EF4444'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {[
                `Patient ${reminderTarget.patientName} is still waiting. Please attend immediately.`,
                'Your consultation appointment is overdue. Please proceed.',
                'Admin alert: Delayed appointment needs urgent attention.',
              ].map(q => (
                <button key={q} onClick={() => setReminderMsg(q)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '11px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{q}</button>
              ))}
            </div>
            <button onClick={sendReminder} disabled={sending || !reminderMsg.trim()}
              style={{ width: '100%', marginTop: '16px', padding: '14px', background: !reminderMsg.trim() ? '#E2E8F0' : '#EF4444', color: !reminderMsg.trim() ? '#94A3B8' : 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: !reminderMsg.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {sending ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Bell size={16} />}
              {sending ? 'Sending…' : '🔔 Send Urgent Reminder'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Active Patient Workflow</h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>
            Patients from vitals stage onwards · {workflowPatients.filter(p => p.status !== 'discharged').length} active · 3s auto-refresh
            {lastSync && <span style={{ marginLeft: '8px', color: '#10B981', fontWeight: 600 }}>· {lastSync.toLocaleTimeString()}</span>}
          </p>
        </div>
        <input type="text" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '13px', width: '220px', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* Stage funnel strip */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px 24px', border: '1px solid #E2E8F0', display: 'flex', overflowX: 'auto', gap: 0 }}>
        {funnelCounts.map((s, i, arr) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '70px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: s.count > 0 ? s.color : '#E2E8F0' }}>{s.count}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px', lineHeight: 1.3 }}>{s.label}</div>
            </div>
            {i < arr.length - 1 && <ChevronRight size={12} color="#E2E8F0" style={{ flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Patient List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: '#64748B' }}>
          <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} /> <span style={{ fontWeight: 600 }}>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
          <Activity size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>No active patients in workflow. (Patients pending vitals submission will appear here.)</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((p, rowIdx) => {
            const meta      = stageMeta(p.status);
            const pLabel    = priorityLabel(p.status);
            const isDischarged = p.status === 'discharged';
            const overdue   = isVisitOverdue(p);
            const stageIdx  = stageIndex(p.status);

            return (
              <div key={p.id || rowIdx} style={{
                background: '#FFFFFF', borderRadius: '14px',
                border: `1px solid ${overdue ? '#FECACA' : isDischarged ? '#E2E8F0' : meta.border}`,
                overflow: 'hidden', opacity: isDischarged ? 0.65 : 1,
                boxShadow: overdue ? '0 0 0 2px rgba(220,38,38,0.15)' : isDischarged ? 'none' : '0 2px 6px rgba(0,0,0,0.04)',
              }}>
                {/* Main row */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Rank */}
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDischarged ? '#F1F5F9' : meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isDischarged ? <CheckCircle2 size={18} color="#94A3B8" /> : <span style={{ fontSize: '14px', fontWeight: 900, color: meta.color }}>#{rowIdx + 1}</span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B' }}>{p.name}</span>
                      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: pLabel.color }}>{pLabel.text}</span>
                      {overdue && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                          <Clock size={11} /> Appointment Overdue
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {p.assignedNurse  && <span>👩‍⚕️ {p.assignedNurse.name}</span>}
                      {p.assignedDoctor && <span>🩺 Dr. {p.assignedDoctor.name} · {p.assignedDoctor.specialization}</span>}
                      {p.issue && <span>💬 {String(p.issue.description || p.issue.text || '').substring(0, 55)}</span>}
                    </div>
                  </div>

                  {/* Progress dots */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                    {PIPELINE.map((stage, si) => (
                      <div key={stage.key} title={`${stage.label}${si < stageIdx ? ' ✓' : si === stageIdx ? ' (now)' : ''}`}
                        style={{ width: si === stageIdx ? '10px' : '7px', height: si === stageIdx ? '10px' : '7px', borderRadius: '50%', background: si < stageIdx ? '#10B981' : si === stageIdx ? meta.color : '#E2E8F0', boxShadow: si === stageIdx ? `0 0 6px ${meta.color}88` : 'none', transition: 'all 0.3s', flexShrink: 0 }} />
                    ))}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', marginLeft: '6px' }}>{stageIdx}/{PIPELINE.length - 1}</span>
                  </div>
                </div>

                {/* Status-aware Dynamic Reminder — only shown for ACTIVE patients */}
                {!isDischarged && (
                  <div style={{ padding: '12px 22px 14px', background: overdue ? '#FFF5F5' : '#F8FAFC', borderTop: `1px solid ${overdue ? '#FECACA' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {overdue ? <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} /> : <Clock size={16} color="#64748B" style={{ flexShrink: 0 }} />}
                    
                    <span style={{ fontSize: '13px', fontWeight: 600, color: overdue ? '#991B1B' : '#475569', flex: 1 }}>
                      {p.status === 'doctor_pending' && p.assignedDoctor && (
                        <>Dr. {p.assignedDoctor.name}'s appointment for <strong>{p.name}</strong> is {overdue ? 'overdue' : 'ongoing'}{p.doctorVisit?.time && ` (scheduled ${p.doctorVisit.time})`}</>
                      )}
                      {(p.status === 'pending_vitals' || p.status === 'vitals_scheduled') && p.assignedNurse && (
                        <>Nurse {p.assignedNurse.name}'s appointment for <strong>{p.name}</strong> is {overdue ? 'overdue' : 'ongoing'}{p.nurseVisit?.time && ` (scheduled ${p.nurseVisit.time})`}</>
                      )}
                      {p.status === 'vitals_collected' && (
                        <>Patient <strong>{p.name}</strong> needs to select a doctor specialist</>
                      )}
                      {p.status === 'billing_pending' && (
                        <>Patient <strong>{p.name}</strong> needs to complete payment and collect prescription</>
                      )}
                      {p.status === 'pharmacy_pending' && (
                        <>Pharmacy is preparing medicines for <strong>{p.name}</strong></>
                      )}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Remind responsible party */}
                      {p.status === 'doctor_pending' && p.assignedDoctor && (
                        <button
                          onClick={() => {
                            setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Doctor', targetId: p.assignedDoctor.id, targetName: `Dr. ${p.assignedDoctor.name}` });
                            setReminderMsg(`Patient ${p.name} is waiting for consultation. ${overdue ? 'Your appointment is overdue — please attend immediately.' : 'Please proceed with the consultation.'}`);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: overdue ? '#DC2626' : '#7C3AED', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Bell size={13} /> Remind Doctor
                        </button>
                      )}
                      {(p.status === 'pending_vitals' || p.status === 'vitals_scheduled') && p.assignedNurse && (
                        <button
                          onClick={() => {
                            setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Nurse', targetId: p.assignedNurse.id, targetName: `Nurse ${p.assignedNurse.name}` });
                            setReminderMsg(`Patient ${p.name} is waiting for vitals check. Please attend to them.`);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Bell size={13} /> Remind Nurse
                        </button>
                      )}
                      {['vitals_collected', 'billing_pending', 'pharmacy_pending'].includes(p.status) && (
                        <button
                          onClick={() => {
                            setReminderTarget({ patientId: p.id, patientName: p.name, role: 'Patient', targetId: p.id, targetName: p.name });
                            setReminderMsg(p.status === 'vitals_collected' ? 'Your vitals are checked. Please select your doctor to proceed.' : 'Your treatment is complete. Please proceed to payment and pharmacy.');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16A34A', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Bell size={13} /> Remind Patient
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminWorkflow;
