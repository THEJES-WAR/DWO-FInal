import React from 'react';
import { Calendar, FileText, Pill, Clock, User, ChevronDown, ChevronUp, Coffee } from 'lucide-react';

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
            {history.map((record, index) => (
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
                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{new Date(record.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                                    {record.type} &middot; <span style={{ color: '#7C3AED' }}>Dr. {record.doctorName}</span>
                                </div>
                            </div>
                        </div>
                        {expanded === index ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                    </div>

                    {expanded === index && (
                        <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ marginTop: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    <FileText size={14} /> Doctor's Feedback
                                </label>
                                <div style={{ background: '#FDFCFB', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9', color: '#444', fontSize: '15px', lineHeight: 1.6 }}>
                                    {record.feedback}
                                </div>
                            </div>

                            {record.prescriptions && record.prescriptions.length > 0 && (
                                <div style={{ marginTop: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
                                        <Pill size={14} /> Prescribed Medications
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {record.prescriptions.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #F1F5F9' }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>{p.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{p.dosage} ({p.type})</div>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                        {['Morning', 'Afternoon', 'Night'].map(t => (
                                                            p[t.toLowerCase()] && (
                                                                <span key={t} style={{ fontSize: '10px', fontWeight: 900, background: '#EEF2FF', color: '#4F46E5', padding: '2px 6px', borderRadius: '4px' }}>{t}</span>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ background: '#F0FDF4', color: '#15803D', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Coffee size={12} /> {p.beforeFood ? 'Before' : 'After'} Food
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '4px' }}>{p.duration || 'As directed'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => {
                                                import('html2pdf.js').then(html2pdf => {
                                                    const content = document.createElement('div');
                                                    content.innerHTML = `
                                                        <div style="padding: 40px; font-family: sans-serif;">
                                                            <h1 style="color: #7C3AED;">MedPlus+ Prescription</h1>
                                                            <p><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
                                                            <p><strong>Doctor:</strong> Dr. ${record.doctorName}</p>
                                                            <hr style="margin: 20px 0" />
                                                            <h3>Doctor's Advise</h3>
                                                            <p>${record.feedback}</p>
                                                            <hr style="margin: 20px 0" />
                                                            <h3>Prescribed Medications</h3>
                                                            <ul style="line-height: 1.8;">
                                                                ${record.prescriptions.map(p => `
                                                                    <li>
                                                                        <strong>${p.name}</strong> - ${p.dosage} (${p.type})<br/>
                                                                        <em>${[p.morning && 'Morning', p.afternoon && 'Afternoon', p.night && 'Night'].filter(Boolean).join(', ')} | ${p.beforeFood ? 'Before' : 'After'} Food</em>
                                                                    </li>
                                                                `).join('')}
                                                            </ul>
                                                        </div>
                                                    `;
                                                    html2pdf.default().from(content).save('MedPlus_Prescription.pdf');
                                                });
                                            }}
                                            style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <FileText size={16} /> Download Prescription
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default VisitHistory;
