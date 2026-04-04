import React from 'react';
import { Activity, Clock } from 'lucide-react';

const PatientQueue = ({ patients, selectedPatient, onSelect }) => {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#8b5cf6" /> Patient Queue ({patients.length})
            </h2>
            
            {patients.length === 0 ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto' }}>All caught up! Queue is empty.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                    {patients.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => onSelect(p)}
                            style={{ 
                                padding: '16px', 
                                border: selectedPatient?.id === p.id ? '2px solid #8b5cf6' : '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                backgroundColor: selectedPatient?.id === p.id ? '#f5f3ff' : '#f8fafc',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{p.name}</h3>
                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#DBEAFE', color: '#1D4ED8', textTransform: 'capitalize' }}>
                                    {p.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={14} /> ID: {p.id.slice(-6).toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientQueue;
