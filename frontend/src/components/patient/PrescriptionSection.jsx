import React from 'react';
import { Pill, AlertCircle, CheckCircle2, Clock, Coffee } from 'lucide-react';

const PrescriptionSection = ({ prescriptions }) => {
    if (!prescriptions || prescriptions.length === 0) return null;

    // Handle both old and new formats
    const meds = Array.isArray(prescriptions) ? prescriptions : [];

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DB2777' }}>
                    <Pill size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Clinical Prescription</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {meds.map((med, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{med.name}</div>
                            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <strong>{med.dosage}</strong> &middot; {med.type}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                {['Morning', 'Afternoon', 'Night'].map(t => {
                                    const isActive = med[t.toLowerCase()];
                                    return (
                                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: isActive ? '#2563EB' : '#CBD5E1' }}>
                                            <Clock size={14} /> {t}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Coffee size={14} /> {med.beforeFood ? 'Before Food' : 'After Food'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginTop: '8px' }}>
                                Duration: {med.duration || 'As prescribed'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', fontSize: '12px', color: '#64748B', fontStyle: 'italic', border: '1px dashed #E2E8F0' }}>
                * Please follow the dosage instructions strictly. If you experience any side effects, contact your doctor immediately.
            </div>
        </div>
    );
};

export default PrescriptionSection;
