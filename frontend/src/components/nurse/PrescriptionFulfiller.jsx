import React, { useState } from 'react';
import { Pill, CheckCircle2, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const PrescriptionFulfiller = ({ patient, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotifications();

    if (!patient.prescriptions || patient.prescriptions.length === 0) return null;

    const latest = patient.prescriptions[patient.prescriptions.length - 1];
    const isFulfilled = latest.status === 'fulfilled';

    const handleFulfill = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://dwo-final.onrender.com/api/nurse/fulfill-prescription`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': localStorage.getItem('user') },
                body: JSON.stringify({ patientId: patient.id })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Prescription marked as fulfilled.' });
                if (onComplete) onComplete();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#FFF1F2', padding: '24px', borderRadius: '16px', border: '1px solid #FECDD3', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#9F1239', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill size={18} /> Pharmacy Fulfillment
                </h3>
                {isFulfilled ? (
                    <span style={{ color: '#15803D', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> FULFILLED
                    </span>
                ) : (
                    <span style={{ color: '#B45309', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> PENDING
                    </span>
                )}
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #FFE4E6' }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {latest.medicines.map((m, i) => (
                        <li key={i} style={{ padding: '8px 0', borderBottom: i === latest.medicines.length - 1 ? 'none' : '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, color: '#1E293B' }}>{m.name}</span>
                            <span style={{ color: '#64748B', fontSize: '13px' }}>{m.dosage} &middot; {m.frequency}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {!isFulfilled && (
                <button 
                    onClick={handleFulfill}
                    disabled={loading}
                    style={{ 
                        width: '100%', background: '#E11D48', color: 'white', border: 'none', padding: '12px', 
                        borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 
                    }}
                >
                    {loading ? 'Processing...' : 'Mark as Handed Over'}
                </button>
            )}
        </div>
    );
};

export default PrescriptionFulfiller;
