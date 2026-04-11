import React, { useState } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { apiUrl } from '../../utils/api';

const API_URL = apiUrl('/nurse');

const VitalsForm = ({ patient, onComplete, initialVitals }) => {
    const { addToast } = useNotifications();
    const [vitals, setVitals] = useState({
        height: initialVitals?.height || '',
        weight: initialVitals?.weight || '',
        bp: initialVitals?.bp || '',
        sugar: initialVitals?.sugar || '',
        heartRate: initialVitals?.heartRate || '',
        temperature: initialVitals?.temperature || '',
        oxygenSaturation: initialVitals?.oxygenSaturation || '',
        notes: initialVitals?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!vitals.height || !vitals.weight || !vitals.bp || !vitals.sugar || !vitals.heartRate || !vitals.temperature) {
            addToast({ type: 'urgent', message: 'Please fill all required vitals.' });
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(`${API_URL}/collect-vitals`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId: patient.id, ...vitals })
            });
            if (res.ok) {
                setSubmitted(true);
                addToast({ type: 'success', message: 'Vitals recorded successfully!' });
                // Automatic refresh removed to prevent "blank page" feel. 
                // Nurse will now click an explicit 'Finish' button.
            } else {
                addToast({ type: 'urgent', message: 'Failed to save vitals.' });
            }
        } catch (err) {
            console.error(err);
            addToast({ type: 'urgent', message: 'Network error.' });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ background: '#F0FDF4', borderRadius: '24px', padding: '32px', border: '1px solid #BBF7D0', textAlign: 'center', marginTop: '24px' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: '#065F46' }}>Completed ✅</h3>
                <p style={{ margin: '0 0 24px 0', color: '#15803D', fontWeight: 500 }}>The patient's vitals have been recorded and they have been notified.</p>
                
                <div style={{ textAlign: 'left', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Captured Vitals Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px', color: '#1E293B' }}>
                        <div><strong>BP:</strong> {vitals.bp}</div>
                        <div><strong>Sugar:</strong> {vitals.sugar}</div>
                        <div><strong>Temp:</strong> {vitals.temperature}°F</div>
                        <div><strong>HR:</strong> {vitals.heartRate} bpm</div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px dashed #BBF7D0', paddingTop: '16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                            Nurse Signature: <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '18px', marginLeft: '10px' }}>{JSON.parse(localStorage.getItem('user'))?.name || 'Authorized Nurse'}</span>
                        </div>
                        <div style={{ width: '200px', height: '1px', background: '#94A3B8', marginTop: '4px' }}></div>
                    </div>
                    
                    <button 
                        onClick={() => onComplete && onComplete()}
                        style={{ 
                            background: '#10B981', color: 'white', border: 'none', 
                            padding: '12px 24px', borderRadius: '12px', fontWeight: 800, 
                            cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        Complete & Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#8B5CF6" /> Vitals Collection
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Height</label>
                    <input
                        type="text"
                        placeholder="170 cm"
                        value={vitals.height}
                        onChange={e => setVitals({ ...vitals, height: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Weight</label>
                    <input
                        type="text"
                        placeholder="68 kg"
                        value={vitals.weight}
                        onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Blood Pressure</label>
                    <input
                        type="text"
                        placeholder="120/80"
                        value={vitals.bp}
                        onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Blood Sugar</label>
                    <input
                        type="text"
                        placeholder="90"
                        value={vitals.sugar}
                        onChange={e => setVitals({ ...vitals, sugar: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Heart Rate</label>
                    <input
                        type="text"
                        placeholder="72"
                        value={vitals.heartRate}
                        onChange={e => setVitals({ ...vitals, heartRate: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Temperature</label>
                    <input
                        type="text"
                        placeholder="98.6"
                        value={vitals.temperature}
                        onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Oxygen Saturation</label>
                    <input
                        type="text"
                        placeholder="98%"
                        value={vitals.oxygenSaturation}
                        onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nurse Notes</label>
                <textarea
                    placeholder="Observation notes for the doctor..."
                    value={vitals.notes}
                    onChange={e => setVitals({ ...vitals, notes: e.target.value })}
                    style={{ width: '100%', minHeight: '110px', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', resize: 'vertical' }}
                />
            </div>

            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Review & Complete</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Once you mark these details as collected, the patient will be notified on their portal to proceed with choosing their desired specialist.
                </p>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ 
                    width: '100%', padding: '20px', background: '#8B5CF6', color: 'white', 
                    borderRadius: '16px', border: 'none', fontWeight: 800, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {loading ? 'Processing...' : <><CheckCircle2 size={24} /> Mark as Got Details & Send to Patient</>}
            </button>
        </div>
    );
};

export default VitalsForm;

