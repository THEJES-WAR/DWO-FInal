import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Loader2 } from 'lucide-react';

const PaymentBox = ({ billing, onPaymentComplete }) => {
    const [cardNum, setCardNum] = useState('');
    const [loading, setLoading] = useState(false);

    if (!billing) return null;

    const handlePay = async () => {
        if (!cardNum) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch('/api/patient/pay-bill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ amount: billing.totalAmount, cardNumber: cardNum })
            });
            if (res.ok) onPaymentComplete();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={20} color="#2563EB" /> Payment Portal
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Dummy Card Number</label>
                        <input 
                            type="text" 
                            placeholder="#### #### #### ####" 
                            value={cardNum} 
                            onChange={e => setCardNum(e.target.value)}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '16px', fontWeight: 700 }} 
                        />
                    </div>
                    <button 
                        onClick={handlePay}
                        disabled={loading || !cardNum}
                        style={{ width: '100%', padding: '18px', background: '#2563EB', color: 'white', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Pay ₹{billing.totalAmount}</>}
                    </button>
                    <p style={{ marginTop: '16px', fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>Secure Dummy Transaction · No real money will be charged</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B' }}>Consultation</span><span style={{ fontWeight: 700 }}>₹{billing.consultationFee || 300}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B' }}>Medicinal Charges</span><span style={{ fontWeight: 700 }}>₹{billing.medicinalCharges || billing.prescriptionFee || 0}</span></div>
                    <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#1E293B' }}><span>Total</span><span>₹{billing.totalAmount}</span></div>
                </div>
            </div>
        </div>
    );
};

export default PaymentBox;
