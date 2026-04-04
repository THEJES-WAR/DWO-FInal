
import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const DischargePanel = ({ patient }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotifications();

    const handleDischarge = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/nurse/discharge-patient`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': localStorage.getItem('user') },
                body: JSON.stringify({ patientId: patient.id })
            });

            if (res.ok) {
                addToast({ type: 'success', message: 'Patient discharged successfully!' });
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
                {loading ? 'Processing...' : <><CheckCircle size={20} /> Authorize Discharge</>}
            </button>
        </div>
    );
};

export default DischargePanel;
