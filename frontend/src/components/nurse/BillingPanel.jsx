import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import DischargePanel from './DischargePanel';

const BillingPanel = ({ patient, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotifications();

    if (!patient.billing) return null;

    const isPaid = patient.billing.status === 'paid';

    const handleMarkPaid = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/nurse/mark-billing-paid`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': localStorage.getItem('user') },
                body: JSON.stringify({ patientId: patient.id })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Payment confirmed!' });
                if (onComplete) onComplete();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} /> Invoice & Payment
                    </h3>
                    {isPaid ? (
                        <span style={{ color: '#15803D', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> PAID
                        </span>
                    ) : (
                        <span style={{ color: '#B45309', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> UNPAID
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>TOTAL PAYABLE</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>₹{patient.billing.totalAmount}</p>
                    </div>
                    {!isPaid && (
                        <button 
                            onClick={handleMarkPaid}
                            disabled={loading}
                            style={{ 
                                background: '#10B981', color: 'white', border: 'none', padding: '0 24px', 
                                borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 
                            }}
                        >
                            {loading ? '...' : 'Accept Payment'}
                        </button>
                    )}
                </div>
            </div>

            {/* Discharge panel appears here once billing initiated */}
            <DischargePanel patient={patient} />
        </div>
    );
};

export default BillingPanel;
