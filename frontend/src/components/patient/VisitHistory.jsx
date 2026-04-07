import React from 'react';
import { 
    Calendar, FileText, Pill, Clock, User, ChevronDown, ChevronUp, 
    Coffee, Activity, Stethoscope, CreditCard, Download, CheckCircle2 
} from 'lucide-react';

const VisitHistory = ({ history }) => {
    const [expanded, setExpanded] = React.useState(null);

    if (!history || history.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0', marginTop: '20px' }}>
                <p style={{ color: '#94A3B8', fontWeight: 600 }}>No medical history found yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Medicinal History</h3>
            {history.map((record, index) => {
                const isNewFormat = !!record.nursePhase;
                const displayDate = record.date || record.dischargedAt || record.createdAt;
                const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown Date';
                
                // Extract data for both old and new formats
                const doctorName = record.doctorPhase?.doctorName || record.doctorName || 'General';
                const feedback = record.doctorPhase?.feedback || record.feedback;
                const prescriptions = record.doctorPhase?.prescriptions || record.prescriptions || [];
                const nurseName = record.nursePhase?.nurseName || record.nurseName || 'Assigned Nurse';
                const vitals = record.nursePhase?.vitals || record.vitals;
                const billing = record.billingPhase || { 
                    totalAmount: record.totalAmount || record.billing?.totalAmount,
                    billNo: record.billNo || record.billing?.billNo,
                    paymentMethod: record.billing?.method || 'Card'
                };

                return (
                    <div key={record._id || index} style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: expanded === index ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none' }}>
                        <div 
                            onClick={() => setExpanded(expanded === index ? null : index)}
                            style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded === index ? '#F8FAFC' : 'transparent' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{formattedDate}</div>
                                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                                        {record.type || 'Consultation'} &middot; <span style={{ color: '#7C3AED' }}>Dr. {doctorName}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>₹{billing.totalAmount}</div>
                                {expanded === index ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                            </div>
                        </div>

                        {expanded === index && (
                            <div style={{ padding: '24px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                {/* Phase 1: Nurse Phase */}
                                <section>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>
                                        <Activity size={14} /> Phase 1: Nurse Vital Collection
                                    </label>
                                    <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '20px', border: '1px solid #F1F5F9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>Primary Nurse: <span style={{ color: '#1E293B' }}>{nurseName}</span></span>
                                            {record.nursePhase?.vitalsAt && (
                                                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{new Date(record.nursePhase.vitalsAt).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                        {vitals ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                                {['BP', 'Sugar', 'HeartRate', 'Temperature'].map(v => (
                                                    <div key={v} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{v}</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>{vitals[v.charAt(0).toLowerCase() + v.slice(1)] || 'N/A'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>No vitals recorded for this visit.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Phase 2: Doctor Phase */}
                                <section>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>
                                        <Stethoscope size={14} /> Phase 2: Specialist Consultation
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9', color: '#444', fontSize: '15px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Doctor's Feedback</div>
                                            <div style={{ lineHeight: 1.6 }}>{feedback}</div>
                                        </div>

                                        {prescriptions.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {prescriptions.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDFCFB', padding: '16px', borderRadius: '14px', border: '1px solid #FEF3C7' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>{p.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{p.dosage} ({p.type})</div>
                                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                                {['Morning', 'Afternoon', 'Night'].map(t => (
                                                                    p[t.toLowerCase()] && (
                                                                        <span key={t} style={{ fontSize: '10px', fontWeight: 900, background: '#FFFBEB', color: '#B45309', padding: '2px 6px', borderRadius: '4px' }}>{t}</span>
                                                                    )
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ background: '#FEF9C3', color: '#854D0E', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <Coffee size={12} /> {p.beforeFood ? 'Before' : 'After'} Food
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Phase 3: Billing Phase */}
                                <section>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>
                                        <CreditCard size={14} /> Phase 3: Billing & Discharge
                                    </label>
                                    <div style={{ background: '#F0FDF4', borderRadius: '16px', padding: '20px', border: '1px solid #BBF7D0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>Bill Number: {billing.billNo}</div>
                                                <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>Paid via {billing.paymentMethod} on {billing.paidAt ? new Date(billing.paidAt).toLocaleDateString() : formattedDate}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>₹{billing.totalAmount}</div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>Paid in Full</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
                                    <button 
                                        onClick={() => {
                                            import('html2pdf.js').then(html2pdf => {
                                                const content = document.createElement('div');
                                                content.innerHTML = `
                                                    <div style="padding: 50px; font-family: 'Helvetica', sans-serif; color: #1E293B;">
                                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 30px;">
                                                            <h1 style="color: #2563EB; margin: 0;">MedPlus+ Invoice</h1>
                                                            <div style="text-align: right;">
                                                                <div style="font-weight: 800;">Bill No: ${billing.billNo}</div>
                                                                <div style="font-size: 14px; color: #64748B;">Date: ${formattedDate}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style="margin-bottom: 40px;">
                                                            <h3 style="color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Patient Details</h3>
                                                            <p><strong>Patient Name:</strong> ${record.patientName || 'MedPlus Patient'}</p>
                                                        </div>

                                                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                                                            <thead>
                                                                <tr style="background: #F8FAFC;">
                                                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #E2E8F0;">Description</th>
                                                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #E2E8F0;">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 12px; border-bottom: 1px solid #F1F5F9;">Consultation Fee (Dr. ${doctorName})</td>
                                                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #F1F5F9;">₹${billing.consultationFee || 300}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding: 12px; border-bottom: 1px solid #F1F5F9;">Medicinal Charges</td>
                                                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #F1F5F9;">₹${billing.prescriptionFee || (billing.totalAmount - (billing.consultationFee || 300))}</td>
                                                                </tr>
                                                                <tr style="background: #F0FDF4; font-weight: 800;">
                                                                    <td style="padding: 12px;">Total Paid</td>
                                                                    <td style="padding: 12px; text-align: right; color: #166534;">₹${billing.totalAmount}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>

                                                        <div style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 50px;">
                                                            <p>This is a computer-generated receipt and does not require a physical signature.</p>
                                                            <p>© ${new Date().getFullYear()} MedPlus+ Clinical Optimization System</p>
                                                        </div>
                                                    </div>
                                                `;
                                                html2pdf.default().from(content).save(`MedPlus_Receipt_${billing.billNo}.pdf`);
                                            });
                                        }}
                                        style={{ background: '#FFFFFF', color: '#1E293B', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Download size={16} /> Download Receipt
                                    </button>
                                    <button 
                                        onClick={() => {
                                            import('html2pdf.js').then(html2pdf => {
                                                const content = document.createElement('div');
                                                content.innerHTML = `
                                                    <div style="padding: 50px; font-family: 'Helvetica', sans-serif; color: #1E293B;">
                                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 30px;">
                                                            <h1 style="color: #7C3AED; margin: 0;">MedPlus+ Prescription</h1>
                                                            <div style="text-align: right;">
                                                                <div style="font-weight: 800;">Dr. ${doctorName}</div>
                                                                <div style="font-size: 14px; color: #64748B;">Date: ${formattedDate}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style="margin-bottom: 40px;">
                                                            <h3 style="color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Advice / Feedback</h3>
                                                            <p style="line-height: 1.6;">${feedback}</p>
                                                        </div>

                                                        <h3 style="color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Medicines</h3>
                                                        <ul style="list-style: none; padding: 0;">
                                                            ${prescriptions.map(p => `
                                                                <li style="background: #F8FAFC; padding: 16px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #F1F5F9;">
                                                                    <div style="font-weight: 800; font-size: 16px;">${p.name}</div>
                                                                    <div style="color: #64748B; font-size: 14px; margin-top: 4px;">${p.dosage} (${p.type})</div>
                                                                    <div style="margin-top: 8px; color: #4F46E5; font-size: 12px; font-weight: 800;">
                                                                        ${[p.morning && 'Morning', p.afternoon && 'Afternoon', p.night && 'Night'].filter(Boolean).join(' - ')} | ${p.beforeFood ? 'Before' : 'After'} Food
                                                                    </div>
                                                                </li>
                                                            `).join('')}
                                                        </ul>

                                                        <div style="margin-top: 100px; text-align: right;">
                                                            <div style="border-top: 1px solid #1E293B; display: inline-block; width: 200px; padding-top: 8px;">
                                                                <strong>Authorized Signatory</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                                html2pdf.default().from(content).save(`MedPlus_Prescription_${formattedDate}.pdf`);
                                            });
                                        }}
                                        style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FileText size={16} /> Download Prescription
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default VisitHistory;
