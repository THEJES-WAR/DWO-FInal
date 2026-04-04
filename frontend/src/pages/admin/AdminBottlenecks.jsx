import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Zap, ShieldAlert, Cpu, RefreshCw } from 'lucide-react';

const card = {
  background: '#FFFFFF', borderRadius: '12px',
  border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const AdminBottlenecks = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin-new/detailed-workflow', {
        headers: { 'x-user': JSON.stringify(user) }
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#64748B' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontWeight: 600 }}>Scanning for bottlenecks…</span>
    </div>
  );

  const delayStats = [
    { stage: 'Check-in', delayCount: 0 },
    { stage: 'Doctor',   delayCount: 0 },
    { stage: 'Pharmacy', delayCount: 0 },
    { stage: 'Lab',      delayCount: 0 },
    { stage: 'Billing',  delayCount: 0 },
  ];

  if (data) {
    data.tableData.forEach(j => {
      if (j.status === 'Delayed' || j.status === 'Critical') {
        if      (['Arrival','Nurse Check-in'].includes(j.currentStage)) delayStats[0].delayCount++;
        else if (j.currentStage === 'Doctor Consultation')              delayStats[1].delayCount++;
        else if (['Prescription','Nurse Medication'].includes(j.currentStage)) delayStats[2].delayCount++;
        else if (j.currentStage === 'Lab/Scan')                        delayStats[3].delayCount++;
        else if (j.currentStage === 'Billing')                         delayStats[4].delayCount++;
      }
    });
  }

  const aiSuggestions = [
    { text: 'Add 1 Doctor to Cardiology — average wait exceeds 45 minutes.', icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2', tag: 'CRITICAL' },
    { text: 'Open extra Pharmacy counter — queue building up rapidly.',        icon: ShieldAlert, color: '#F59E0B', bg: '#FFFBEB', tag: 'WARNING'  },
    { text: 'Deploy helper nurse to OPD for triage assistance.',               icon: Zap,         color: '#3B82F6', bg: '#EFF6FF', tag: 'ADVISORY' },
  ];

  const DEPARTMENTS  = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'];
  const HEAT_STAGES  = ['Consult', 'Lab', 'Meds', 'Billing'];
  const delayedBase  = data?.delayedBreakdown ?? 0;

  const heatCell = (val) => {
    if (val > 4) return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    if (val > 2) return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    if (val > 0) return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    return { bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0' };
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
          Operations Bottlenecks
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>
          Real-time delay detection and AI-assisted resource reallocation
        </p>
      </div>

      {/* Bar chart + AI suggestions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Bar chart */}
        <div style={{ ...card, padding: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Delay Frequency per Stage</p>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, margin: '0 0 20px' }}>Number of delayed/critical patients at each care stage</p>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayStats} margin={{ top: 6, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} dy={8} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(241,245,249,0.6)' }}
                  contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
                />
                <Bar dataKey="delayCount" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {delayStats.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.delayCount > 3 ? '#EF4444' : entry.delayCount > 1 ? '#F59E0B' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={17} color="#2563EB" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>AI Logic Core</p>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>Automated suggestions</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {aiSuggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{
                  ...card, padding: '16px',
                  borderLeft: `4px solid ${s.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={s.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        display: 'inline-block', fontSize: '10px', fontWeight: 700,
                        color: s.color, background: s.bg, padding: '1px 7px',
                        borderRadius: '20px', marginBottom: '6px', letterSpacing: '0.05em',
                      }}>{s.tag}</span>
                      <p style={{ fontSize: '12.5px', fontWeight: 500, color: '#374151', lineHeight: 1.5, margin: 0 }}>{s.text}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 700,
                      background: '#2563EB', color: '#fff', border: 'none',
                      borderRadius: '6px', cursor: 'pointer',
                    }}>Execute</button>
                    <button style={{
                      flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 600,
                      background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0',
                      borderRadius: '6px', cursor: 'pointer',
                    }}>Dismiss</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ ...card, padding: '24px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Department × Stage Delay Matrix</p>
        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, margin: '0 0 20px' }}>Heatmap of delayed patients per department and care stage</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '500px' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Department
                </th>
                {HEAT_STAGES.map(s => (
                  <th key={s} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((dept, i) => (
                <tr key={dept} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>{dept}</td>
                  {HEAT_STAGES.map((s, j) => {
                    const val = (i + j + delayedBase) % 6;
                    const c   = heatCell(val);
                    return (
                      <td key={s} style={{ padding: '8px' }}>
                        <div style={{
                          padding: '10px 8px', borderRadius: '8px',
                          background: c.bg, border: `1px solid ${c.border}`,
                          textAlign: 'center', fontSize: '12px', fontWeight: 700, color: c.color,
                          transition: 'all 0.2s',
                        }}>
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Critical (>4)', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
            { label: 'High (>2)',     bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
            { label: 'Low (>0)',      bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { label: 'None',          bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.border}` }}></div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminBottlenecks;
