import React, { useState } from 'react';
import { Activity, Clock, Beaker, CreditCard, CheckCircle2, User, Stethoscope } from 'lucide-react';

const PatientQueue = ({ patients, selectedPatient, onSelect }) => {
    const [tab, setTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');
    const getPatientId = (patient) => patient?.id || patient?._id || '';

    // Chronological Sorting: Sort by scheduled time
    const sortedPatients = [...patients].sort((a, b) => {
        const timeA = a.nurseVisit?.time || a.appointmentSlot?.time || '99:99';
        const timeB = b.nurseVisit?.time || b.appointmentSlot?.time || '99:99';
        
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        
        // Secondary sort by createdAt
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const activePatients = sortedPatients.filter(p => ['pending_vitals', 'vitals_scheduled', 'payment_pending_cash', 'payment_completed'].includes(p.status));
    const historyPatients = sortedPatients.filter(p => !['pending_vitals', 'vitals_scheduled', 'payment_pending_cash', 'payment_completed'].includes(p.status));

    const displayPatients = (tab === 'active' ? activePatients : historyPatients).filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        getPatientId(p).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <button 
                    onClick={() => setTab('active')}
                    style={{ flex: 1, padding: '20px', border: 'none', background: tab === 'active' ? '#FFFFFF' : 'transparent', color: tab === 'active' ? '#8B5CF6' : '#64748B', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: tab === 'active' ? '2px solid #8B5CF6' : 'none' }}
                >Active Patients ({activePatients.length})</button>
                <button 
                    onClick={() => setTab('history')}
                    style={{ flex: 1, padding: '20px', border: 'none', background: tab === 'history' ? '#FFFFFF' : 'transparent', color: tab === 'history' ? '#8B5CF6' : '#64748B', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: tab === 'history' ? '2px solid #8B5CF6' : 'none' }}
                >History ({historyPatients.length})</button>
            </div>
            
            <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <input 
                    type="text" 
                    placeholder={`Search ${tab} patients...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        width: '100%', padding: '10px 14px', borderRadius: '10px', 
                        border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none',
                        background: '#FAFBFC'
                    }}
                />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                {displayPatients.length === 0 ? (
                    <div style={{ color: '#94A3B8', textAlign: 'center', margin: 'auto' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                        <p style={{ fontSize: '13px', fontWeight: 600 }}>Queue is empty</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {displayPatients.map(p => {
                            const patientId = getPatientId(p);
                            const isSelected = getPatientId(selectedPatient) === patientId;
                            let statusIcon = <Activity size={12} />;
                            let statusColor = '#F1F5F9';
                            let textColor = '#64748B';
                            let label = (p.status || 'unknown').replace(/_/g, ' ');

                            switch (p.status) {
                                case 'pending_vitals':
                                    statusIcon = <Beaker size={12} />;
                                    statusColor = '#F5F3FF';
                                    textColor = '#7C3AED';
                                    label = 'Vitals Req';
                                    break;
                                case 'vitals_scheduled':
                                    statusIcon = <Clock size={12} />;
                                    statusColor = '#EFF6FF';
                                    textColor = '#2563EB';
                                    label = 'Scheduled';
                                    break;
                                case 'vitals_collected':
                                    statusIcon = <User size={12} />;
                                    statusColor = '#ECFDF5';
                                    textColor = '#059669';
                                    label = 'Vitals Done';
                                    break;
                                case 'doctor_pending':
                                    statusIcon = <Stethoscope size={12} />;
                                    statusColor = '#FFF7ED';
                                    textColor = '#C2410C';
                                    label = 'Consulting';
                                    break;
                                case 'billing_pending':
                                    statusIcon = <CreditCard size={12} />;
                                    statusColor = '#FEF2F2';
                                    textColor = '#DC2626';
                                    label = 'Bill Mentoring';
                                    break;
                                case 'payment_pending_cash':
                                    statusIcon = <CreditCard size={12} />;
                                    statusColor = '#FFFBEB';
                                    textColor = '#D97706';
                                    label = 'Cash Pending';
                                    break;
                                case 'payment_completed':
                                    statusIcon = <CheckCircle2 size={12} />;
                                    statusColor = '#F0FDF4';
                                    textColor = '#166534';
                                    label = 'Check-out';
                                    break;
                                case 'discharged':
                                    statusIcon = <Activity size={12} />;
                                    statusColor = '#F1F5F9';
                                    textColor = '#64748B';
                                    label = 'Discharged';
                                    break;
                            }

                            return (
                                <div 
                                    key={patientId || p.name} 
                                    onClick={() => onSelect(p)}
                                    style={{ 
                                        padding: '14px', 
                                        border: '1px solid', 
                                        borderColor: isSelected ? '#8B5CF6' : '#F1F5F9',
                                        borderRadius: '14px', 
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 10px 15px -3px rgba(139, 92, 246, 0.1)' : 'none',
                                        opacity: p.status === 'discharged' ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <h3 style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{p.name}</h3>
                                        <span style={{ 
                                            fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', 
                                            backgroundColor: statusColor, color: textColor, textTransform: 'uppercase',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            {statusIcon} {label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                                        ID: {(patientId || 'N/A').slice(-6).toUpperCase()} &middot; {(p.issue?.description || 'No issue logged').substring(0, 15)}...
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientQueue;
