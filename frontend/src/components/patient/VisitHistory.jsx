import React from 'react';
import { 
    Calendar, FileText, Pill, Clock, User, ChevronDown, ChevronUp, 
    Coffee, Activity, Stethoscope, CreditCard, Download, CheckCircle2 
} from 'lucide-react';

const VisitHistory = ({ history }) => {
    const [expanded, setExpanded] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredHistory = React.useMemo(() => {
        if (!history) return [];
        if (!searchQuery.trim()) return history;
        
        return history.filter(record => {
            const doctorName = record.doctorPhase?.doctorName || record.doctorName || '';
            const nurseName = record.nursePhase?.nurseName || record.nurseName || '';
            const feedback = record.doctorPhase?.feedback || record.feedback || '';
            const billNo = record.billingPhase?.billNo || record.billNo || record.billing?.billNo || '';
            
            return (
                doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                nurseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
                billNo.toString().toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [history, searchQuery]);

    if (!history || history.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0', marginTop: '20px' }}>
                <p style={{ color: '#94A3B8', fontWeight: 600 }}>No medical history found yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Medicinal History</h3>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search records (Doctor, Nurse, Notes...)" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                            fontSize: '13px', width: '300px', background: '#FFFFFF',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {filteredHistory.length === 0 && searchQuery && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>
                    No records match your search.
                </div>
            )}

            {filteredHistory.map((record, index) => {
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
                    paymentMethod: record.billing?.method || 'Card',
                    consultationFee: record.billing?.consultationFee || 300,
                    medicinalCharges: record.billing?.medicinalCharges || 0
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
                                                    <div style="padding: 50px; font-family: 'Helvetica', sans-serif; color: #1E293B; background: white;">
                                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px;">
                                                            <div>
                                                                <h1 style="color: #2563EB; margin: 0; font-size: 32px;">MedPlus<span style="color: #1E293B;">+</span></h1>
                                                                <div style="font-size: 14px; font-weight: 600; color: #64748B;">Clinical Optimization System</div>
                                                                <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Main Branch, Healthcare Square, NH-42</div>
                                                            </div>
                                                            <div style="text-align: right;">
                                                                <div style="font-weight: 900; font-size: 18px; color: #1E293B;">TAX INVOICE</div>
                                                                <div style="font-weight: 800; color: #2563EB;">Bill No: ${billing.billNo}</div>
                                                                <div style="font-size: 14px; color: #64748B;">Date: ${formattedDate}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style="margin-bottom: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                                            <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0;">
                                                                <h3 style="color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 0; font-size: 14px; text-transform: uppercase;">Patient Details</h3>
                                                                <p style="margin: 8px 0; font-size: 15px;"><strong>Name:</strong> ${record.patientName || 'MedPlus Patient'}</p>
                                                                <p style="margin: 8px 0; font-size: 14px; color: #64748B;"><strong>Visit Date:</strong> ${formattedDate}</p>
                                                            </div>
                                                            <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0; text-align: right;">
                                                                <h3 style="color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 0; font-size: 14px; text-transform: uppercase;">Payment Info</h3>
                                                                <p style="margin: 8px 0; font-size: 15px;"><strong>Method:</strong> ${billing.paymentMethod || 'Online Payment'}</p>
                                                                <p style="margin: 8px 0; font-size: 14px; color: #10B981;"><strong>Status:</strong> PAID IN FULL</p>
                                                            </div>
                                                        </div>

                                                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                                                            <thead>
                                                                <tr style="background: #F1F5F9;">
                                                                    <th style="padding: 15px; text-align: left; border-bottom: 2px solid #E2E8F0; font-size: 13px; text-transform: uppercase; color: #475569;">Description</th>
                                                                    <th style="padding: 15px; text-align: right; border-bottom: 2px solid #E2E8F0; font-size: 13px; text-transform: uppercase; color: #475569;">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 15px; border-bottom: 1px solid #F1F5F9;">Consultation Fee (Dr. ${doctorName})</td>
                                                                    <td style="padding: 15px; text-align: right; border-bottom: 1px solid #F1F5F9; font-weight: 600;">₹${billing.consultationFee || 300}.00</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding: 15px; border-bottom: 1px solid #F1F5F9;">Medicinal Charges</td>
                                                                    <td style="padding: 15px; text-align: right; border-bottom: 1px solid #F1F5F9; font-weight: 600;">₹${billing.medicinalCharges || (billing.totalAmount - (billing.consultationFee || 300))}.00</td>
                                                                </tr>
                                                                <tr style="background: #F0FDF4; font-weight: 900; font-size: 18px;">
                                                                    <td style="padding: 15px; color: #1E293B;">TOTAL AMOUNT PAID</td>
                                                                    <td style="padding: 15px; text-align: right; color: #166534;">₹${billing.totalAmount}.00</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>

                                                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
                                                            <div style="font-size: 11px; color: #94A3B8; max-width: 300px;">
                                                                <p>* This is a computer-generated receipt and does not require a physical signature.</p>
                                                                <p>* For any billing queries, please contact medplus_billing@hospital.com</p>
                                                                <p>© ${new Date().getFullYear()} MedPlus+ DWOS</p>
                                                            </div>
                                                            <div style="text-align: center;">
                                                                <div style="width: 120px; height: 50px; border: 3px double #2563EB; display: flex; align-items: center; justify-content: center; color: #2563EB; font-weight: 900; font-size: 18px; opacity: 0.8; transform: rotate(-5deg); margin-bottom: 10px;">
                                                                    MEDPLUS+
                                                                </div>
                                                                <div style="font-size: 12px; font-weight: 800; color: #1E293B;">CERTIFIED RECEIPT</div>
                                                            </div>
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
                                                    <div style="padding: 50px; font-family: 'Helvetica', sans-serif; color: #1E293B; background: white;">
                                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #7C3AED; padding-bottom: 24px; margin-bottom: 40px;">
                                                            <div>
                                                                <h1 style="color: #7C3AED; margin: 0; font-size: 36px;">MedPlus<span style="color: #1E293B;">+</span></h1>
                                                                <div style="font-size: 14px; font-weight: 700; color: #6D28D9; margin-top: 4px;">Premium Healthcare & Clinical Wellness</div>
                                                                <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Main Road, Jubilee Hills, Hyderabad - 500033</div>
                                                                <div style="font-size: 12px; color: #94A3B8;">Emergency: +91 99999 88888 | www.medplus.com</div>
                                                            </div>
                                                            <div style="text-align: right;">
                                                                <div style="font-weight: 900; color: #1E293B; font-size: 18px; margin-bottom: 4px;">DR. ${doctorName.toUpperCase()}</div>
                                                                <div style="font-size: 14px; color: #7C3AED; font-weight: 700;">${record.doctorPhase?.specialization || 'Clinical Specialist'}</div>
                                                                <div style="font-size: 13px; color: #64748B; margin-top: 8px;">Date: ${formattedDate}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style="margin-bottom: 40px; background: #FAF5FF; padding: 25px; border-radius: 16px; border: 1px solid #E9D5FF;">
                                                            <h3 style="color: #7C3AED; border-bottom: 2px solid #DDD6FE; padding-bottom: 10px; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Advice / Clinical Feedback</h3>
                                                            <p style="line-height: 1.8; font-size: 16px; color: #4B24B1; font-weight: 500;">
                                                                ${feedback || 'Rest, stay hydrated, and monitor symptoms. Follow the prescribed medication course strictly.'}
                                                            </p>
                                                        </div>
 
                                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                                                            <div style="width: 30px; height: 2px; background: #7C3AED;"></div>
                                                            <h3 style="color: #1E293B; margin: 0; font-size: 16px; text-transform: uppercase;">Rx Prescribed Meds</h3>
                                                        </div>

                                                        <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 60px;">
                                                            ${prescriptions.map(p => `
                                                                <div style="background: #FFFFFF; padding: 18px; border-radius: 12px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
                                                                    <div style="flex: 1;">
                                                                        <div style="font-weight: 900; font-size: 18px; color: #1E293B;">${p.name}</div>
                                                                        <div style="color: #64748B; font-size: 14px; margin-top: 4px; font-weight: 600;">${p.dosage} &middot; ${p.type}</div>
                                                                    </div>
                                                                    <div style="text-align: right;">
                                                                        <div style="color: #7C3AED; font-size: 13px; font-weight: 800; background: #F5F3FF; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                                                                            ${[p.morning && 'Morning', p.afternoon && 'Afternoon', p.night && 'Night'].filter(Boolean).join(' - ')}
                                                                        </div>
                                                                        <div style="margin-top: 8px; color: #94A3B8; font-size: 12px; font-weight: 700;">
                                                                            ${p.beforeFood ? 'BEFORE FOOD' : 'AFTER FOOD'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            `).join('')}
                                                        </div>
 
                                                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 80px;">
                                                            <div style="font-size: 11px; color: #94A3B8; font-style: italic;">
                                                                * This is a digitally signed medical advisory.<br>
                                                                * For follow-up visits, please bring this copy or and ID number.
                                                            </div>
                                                            <div style="text-align: center;">
                                                                <div style="border: 2px solid #7C3AED; color: #7C3AED; padding: 10px; border-radius: 5px; font-weight: 900; font-size: 14px; transform: rotate(10deg); display: inline-block; background: rgba(124, 58, 237, 0.05);">
                                                                    MEDPLUS+ STAMP<br>
                                                                    <span style="font-size: 10px;">APPROVED</span>
                                                                </div>
                                                                <div style="margin-top: 20px; border-top: 1.5px solid #1E293B; width: 180px; padding-top: 8px;">
                                                                    <strong style="font-size: 14px;">Authorized Signatory</strong>
                                                                </div>
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
