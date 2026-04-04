import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

const STAGES = [
  'Arrival', 'Nurse Check-in', 'Doctor Consultation',
  'Prescription', 'Nurse Medication', 'Lab/Scan',
  'Billing', 'Discharge'
];

const STAGE_ABBR = ['ARR', 'CHK', 'DOC', 'RX', 'MED', 'LAB', 'BILL', 'DC'];

const statusBadge = (status) => {
  const map = {
    'Completed': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    'In Progress': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    'Delayed':    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    'Critical':   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  };
  return map[status] || { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
};

const AdminWorkflow = () => {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin-new/detailed-workflow', {
        headers: { 'x-user': JSON.stringify(user) }
      });
      if (res.ok) { const d = await res.json(); setJourneys(d.tableData); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#64748B' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontWeight: 600 }}>Loading patient journeys…</span>
    </div>
  );

  const FILTERS = ['All', 'Critical', 'Delayed', 'In Progress', 'Completed'];
  const filtered = filter === 'All' ? journeys : journeys.filter(j => j.status === filter);

  const counts = {
    All: journeys.length,
    Critical: journeys.filter(j => j.status === 'Critical').length,
    Delayed:  journeys.filter(j => j.status === 'Delayed').length,
    'In Progress': journeys.filter(j => j.status === 'In Progress').length,
    Completed: journeys.filter(j => j.status === 'Completed').length,
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
            Live Patient Workflow
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: '4px 0 0' }}>
            Tracking {journeys.length} patients across 8 care stages · 30s auto-refresh
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Done',    color: '#22C55E' },
            { label: 'Active',  color: '#3B82F6' },
            { label: 'Delayed', color: '#EF4444' },
            { label: 'Pending', color: '#CBD5E1' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: l.color }}></div>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const badge  = statusBadge(f);
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              background: active ? '#1E293B' : '#FFFFFF',
              color:      active ? '#FFFFFF'  : '#64748B',
              borderColor: active ? '#1E293B' : '#E2E8F0',
              transition: 'all 0.15s',
            }}>
              {f}
              <span style={{
                marginLeft: '6px', padding: '0 6px',
                background: active ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                borderRadius: '10px', fontSize: '11px',
                color: active ? '#fff' : '#64748B',
              }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Patient', 'Stage Progress', 'Status', 'Assigned Staff', 'Elapsed', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>
                    No patients match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((j, rowIdx) => {
                const badge = statusBadge(j.status);
                const isCritical = j.status === 'Critical';
                return (
                  <tr key={j._id} style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: isCritical ? '#FFF9F9' : '#FFFFFF',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = isCritical ? '#FEF2F2' : '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isCritical ? '#FFF9F9' : '#FFFFFF'}
                  >
                    {/* Patient */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: isCritical ? '#FEE2E2' : '#EFF6FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '13px',
                          color: isCritical ? '#DC2626' : '#2563EB',
                          flexShrink: 0,
                        }}>
                          {j.patientName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B' }}>{j.patientName}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, marginTop: '1px' }}>
                            <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', color: '#475569', fontWeight: 700 }}>
                              {j.patientId?.slice(-6).toUpperCase()}
                            </span>
                            &nbsp;· {j.ward} · {j.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pipeline */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Dots row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                          {/* connector line only spans the dots */}
                          <div style={{ position: 'absolute', left: '6px', right: '6px', top: '50%', transform: 'translateY(-50%)', height: '2px', background: '#F1F5F9', zIndex: 0 }}></div>
                          {STAGES.map((s, idx) => {
                            const si = j.stages?.find(st => st.name === s);
                            let dotColor = '#E2E8F0';
                            if (si?.status === 'Done') dotColor = '#22C55E';
                            else if (si?.status === 'In Progress') {
                              dotColor = (j.status === 'Delayed' || j.status === 'Critical') ? '#EF4444' : '#3B82F6';
                            }
                            return (
                              <div key={idx} title={`${s}: ${si ? `${si.status} · ${si.timeSpent}m` : 'Pending'}`}
                                style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
                                <div style={{
                                  width: '13px', height: '13px', borderRadius: '50%',
                                  background: dotColor,
                                  boxShadow: si?.status === 'In Progress' ? `0 0 0 4px ${dotColor}28` : 'none',
                                  transition: 'all 0.2s',
                                }}></div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Stage label below the dots */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: '#F8FAFC', border: '1px solid #E2E8F0',
                          borderRadius: '6px', padding: '2px 8px',
                          fontSize: '11px', fontWeight: 600, color: '#475569',
                          whiteSpace: 'nowrap', alignSelf: 'flex-start',
                        }}>
                          {j.currentStage}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: 700,
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      }}>
                        {(j.status === 'Delayed' || j.status === 'Critical') && <AlertTriangle size={10} />}
                        {j.status === 'Completed' && <CheckCircle2 size={10} />}
                        {j.status}
                      </span>
                    </td>

                    {/* Staff */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                        {j.assignedDoctor && <div style={{ color: '#4F46E5', marginBottom: '2px' }}>{j.assignedDoctor}</div>}
                        {j.assignedNurse  && <div style={{ color: '#64748B' }}>{j.assignedNurse}</div>}
                        {!j.assignedDoctor && !j.assignedNurse && <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Unassigned</span>}
                      </div>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color={j.status === 'Delayed' || j.status === 'Critical' ? '#EF4444' : '#94A3B8'} />
                        <span style={{
                          fontSize: '14px', fontWeight: 800, lineHeight: 1,
                          color: (j.status === 'Delayed' || j.status === 'Critical') ? '#DC2626' : '#1E293B',
                        }}>
                          {j.totalTime}m
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px' }}>
                      <button style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '7px',
                        fontSize: '11.5px', fontWeight: 700,
                        background: '#F8FAFC', color: '#475569',
                        border: '1px solid #E2E8F0', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#1D4ED8'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569';  e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
            Showing {filtered.length} of {journeys.length} patients
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700 }}>
              {counts.Critical} Critical
            </span>
            <span style={{ fontSize: '12px', color: '#C2410C', fontWeight: 700 }}>
              {counts.Delayed} Delayed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkflow;
