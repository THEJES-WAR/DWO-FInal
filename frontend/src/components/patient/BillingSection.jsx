import React, { useState } from 'react';
import { CreditCard, Download, CheckCircle2, Clock, Wallet, Banknote } from 'lucide-react';

const BillingSection = ({ billing, onPay }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isPaying, setIsPaying] = useState(false);

    if (!billing) return null;

    const isPaid = billing.status === 'paid';

    const handlePayment = () => {
        if (paymentMethod === 'card' && cardNumber.length !== 10) {
            alert('Please enter exactly 10 digits for the dummy card number.');
            return;
        }
        setIsPaying(true);
        // Simulate a slight delay for realistic feeling
        setTimeout(() => {
            onPay(billing.totalAmount, paymentMethod);
            setIsPaying(false);
        }, 800);
    };

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                        <Wallet size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Invoice & Billing</h2>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    background: isPaid ? '#F0FDF4' : '#FEF3C7', 
                    color: isPaid ? '#15803D' : '#92400E',
                    fontSize: '13px',
                    fontWeight: 700
                }}>
                    {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    {isPaid ? 'Paid' : 'Payment Pending'}
                </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Consultation Fee</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>₹{billing.consultationFee}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Clinical Tests</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>₹{billing.testCharges}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingBottom: '16px', borderBottom: '1px dashed #CBD5E1' }}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Medications</span>
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>₹{billing.medicationCharges}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', paddingTop: '4px' }}>
                        <span style={{ color: '#1E293B', fontWeight: 800 }}>Total Amount</span>
                        <span style={{ color: '#2563EB', fontWeight: 900 }}>₹{billing.totalAmount}</span>
                    </div>
                </div>
            </div>

            {isPaid ? (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Payment Completed</p>
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                            {new Date(billing.paidAt || billing.generatedAt).toLocaleString()}
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            import('html2pdf.js').then(html2pdf => {
                                const content = document.createElement('div');
                                content.innerHTML = `
                                    <div style="padding: 40px; font-family: sans-serif;">
                                        <h1 style="color: #2563EB;">MedPlus+ Receipt</h1>
                                        <p><strong>Date:</strong> ${new Date(billing.paidAt || billing.generatedAt).toLocaleString()}</p>
                                        <hr style="margin: 20px 0" />
                                        <p><strong>Consultation Fee:</strong> Rs. ${billing.consultationFee}</p>
                                        <p><strong>Medications:</strong> Rs. ${billing.medicationCharges}</p>
                                        <hr style="margin: 20px 0" />
                                        <h2>Total Paid: Rs. ${billing.totalAmount}</h2>
                                        <p style="color: #15803D; font-weight: bold;">Status: PAID COMPLETED</p>
                                    </div>
                                `;
                                html2pdf.default().from(content).save('MedPlus_Receipt.pdf');
                            });
                        }}
                        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Download size={16} /> Receipt
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <button 
                                onClick={() => setPaymentMethod('card')}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentMethod === 'card' ? '2px solid #2563EB' : '1px solid #E2E8F0', background: paymentMethod === 'card' ? '#EFF6FF' : '#FFF', color: paymentMethod === 'card' ? '#2563EB' : '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <CreditCard size={18} /> Card Option
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentMethod === 'cash' ? '2px solid #16A34A' : '1px solid #E2E8F0', background: paymentMethod === 'cash' ? '#F0FDF4' : '#FFF', color: paymentMethod === 'cash' ? '#16A34A' : '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Banknote size={18} /> Cash Option
                            </button>
                        </div>
                        
                        {paymentMethod === 'card' ? (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Card Number</label>
                                <input 
                                    type="text" 
                                    placeholder="Card Number"
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                                    style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', outline: 'none' }}
                                />
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>Enter 10 digit number.</p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748B', textAlign: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '8px' }}>
                                    Confirm paying ₹{billing.totalAmount} in cash at the counter.
                                </p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handlePayment}
                        disabled={isPaying || (paymentMethod === 'card' && cardNumber.length !== 10)}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px', 
                            background: isPaying || (paymentMethod === 'card' && cardNumber.length !== 10) ? '#94A3B8' : '#2563EB',
                            color: 'white', border: 'none', fontWeight: 800, fontSize: '16px', cursor: isPaying || (paymentMethod === 'card' && cardNumber.length !== 10) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isPaying ? 'Processing...' : `Pay ₹${billing.totalAmount}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BillingSection;
