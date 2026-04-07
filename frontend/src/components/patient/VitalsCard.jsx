import React from 'react';
import { Activity, Droplets, Heart, Thermometer } from 'lucide-react';

const VitalsCard = ({ vitals }) => {
    if (!vitals) return null;

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#2563EB" /> Vitals Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Activity size={14} color="#0F766E" /> Height
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.height || '-'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Heart size={14} color="#7C3AED" /> Weight
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.weight || '-'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Activity size={14} color="#EF4444" /> Blood Pressure
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.bp} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>mmHg</span></div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Droplets size={14} color="#3B82F6" /> Blood Sugar
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.sugar} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>mg/dL</span></div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Heart size={14} color="#EC4899" /> Heart Rate
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.heartRate} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>bpm</span></div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Thermometer size={14} color="#F59E0B" /> Temperature
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.temperature} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>deg F</span></div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Droplets size={14} color="#0891B2" /> Oxygen Saturation
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{vitals.oxygenSaturation || '-'}</div>
                </div>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                Collected by your assigned nurse on {new Date(vitals.collectedAt).toLocaleString()}
            </div>
            {vitals.notes && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>
                    <strong style={{ color: '#1E293B' }}>Nurse notes:</strong> {vitals.notes}
                </div>
            )}
        </div>
    );
};

export default VitalsCard;
