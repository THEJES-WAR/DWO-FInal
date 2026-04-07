import React from 'react';
import { Pill, CheckCircle, Package } from 'lucide-react';

const PharmacyView = ({ prescriptions, patientId }) => {
    if (!prescriptions || prescriptions.length === 0) return null;

    return (
        <div style={{ background: '#FFF7ED', padding: '32px', borderRadius: '24px', border: '1px solid #FFEDD5', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Pill size={20} color="#F97316" /> Pharmacy Fulfillment
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 900, background: '#F97316', color: 'white', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' }}>Ready for Collection</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {prescriptions.map((m, i) => (
                    <div key={i} style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid #FED7AA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <div>
                            <span style={{ fontWeight: 800, color: '#431407', fontSize: '16px' }}>{m.name}</span>
                            <div style={{ fontSize: '13px', color: '#9A3412', marginTop: '4px' }}>
                                <strong>{m.dosage}</strong> ({m.type}) &middot; 
                                <span style={{ color: '#F97316', fontWeight: 800, marginLeft: '6px' }}>
                                    {[m.morning && 'Morning', m.afternoon && 'Afternoon', m.night && 'Night'].filter(Boolean).join(' - ')}
                                </span>
                            </div>
                        </div>
                        <div style={{ background: '#FFEDD5', padding: '6px 12px', borderRadius: '8px', color: '#9A3412', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}>
                            {m.beforeFood ? 'Before Food' : 'After Food'}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '16px', borderRadius: '12px', fontSize: '13px', color: '#9A3412', lineHeight: 1.6, border: '1px dashed #FED7AA' }}>
                <strong>Nurse Note:</strong> Please verify the dosage and frequency with the patient before handing over the medication. Ensure that for each item above, the patient acknowledges the instructions.
            </div>
        </div>
    );
};

export default PharmacyView;
