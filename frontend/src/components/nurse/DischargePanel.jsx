import React, { useState } from 'react';
import { CheckCircle, LogOut, Pill } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { apiUrl } from '../../utils/api';

const DischargePanel = ({ patient, prescribedMedicines = [], onDischarge }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotifications();

    const handleDischarge = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl('/nurse/discharge-patient'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': localStorage.getItem('user') },
                body: JSON.stringify({ patientId: patient.id })
            });

            if (res.ok) {
                addToast({ type: 'success', message: 'Patient discharged successfully!' });
                if (onDischarge) onDischarge(patient.id, prescribedMedicines);
            } else {
                const err = await res.json();
                addToast({ type: 'urgent', message: `Discharge blocked: ${err.error}` });
            }
        } catch (err) {
            addToast({ type: 'urgent', message: 'Network error preventing discharge' });
        } finally {
            setLoading(false);
        }
    };

    const isPaid = patient.billing?.status === 'paid';

    return (
        <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '2px dashed #CBD5E1', marginTop: '24px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Discharge Authorization</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748B' }}>
                Ensure all tests are completed and billing is finalized.
            </p>

            {!isPaid && (
                <div style={{ padding: '8px 16px', background: '#FEF2F2', color: '#EF4444', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'inline-block', marginBottom: '16px' }}>
                    Billing is currently pending. Cannot discharge.
                </div>
            )}

            {/* Prescribed Medicines Summary */}
            {prescribedMedicines && prescribedMedicines.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '10px' }}>Medications for Collection</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {prescribedMedicines.map((rx, i) => (
                            <div key={i} style={{ fontSize: '13px', color: '#15803D', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>• {rx.name}</span>
                                <span style={{ fontSize: '11px', opacity: 0.8 }}>{rx.dosage}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                onClick={handleDischarge}
                disabled={loading || !isPaid}
                style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '14px', borderRadius: '10px', border: 'none', background: '#10B981', color: 'white',
                    fontSize: '16px', fontWeight: 700, cursor: (loading || !isPaid) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !isPaid) ? 0.6 : 1, transition: 'all 0.2s'
                }}
            >
                {loading ? 'Processing...' : <><LogOut size={20} /> Finalize & Discharge Patient</>}
            </button>

            {/* Dummy Signature Area */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>Official Authorization</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '20px', color: '#1E293B' }}>{JSON.parse(localStorage.getItem('user'))?.name}</div>
                        <div style={{ width: '150px', height: '1px', background: '#E2E8F0', marginTop: '4px' }}></div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>Assigned Nurse Signature</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>Stamp:</div>
                        <div style={{ width: '60px', height: '60px', border: '2px double #10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: '10px', fontWeight: 900, transform: 'rotate(-15deg)', background: '#F0FDF4' }}>
                            MEDPLUS+
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DischargePanel;
