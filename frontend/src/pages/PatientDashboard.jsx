import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Activity, Bell, LogOut, CheckCircle2, Clock, User, CreditCard, CheckCircle, Stethoscope } from 'lucide-react';

import { useNotifications } from '../context/NotificationContext';
import StatusCard from '../components/patient/StatusCard';
import IssueSubmission from '../components/patient/IssueSubmission';
import NurseCard from '../components/patient/NurseCard';
import VitalsCard from '../components/patient/VitalsCard';
import DoctorSelector from '../components/patient/DoctorSelector';
import FeedbackSection from '../components/patient/FeedbackSection';
import PrescriptionSection from '../components/patient/PrescriptionSection';
import PaymentBox from '../components/patient/PaymentBox';
import VisitHistory from '../components/patient/VisitHistory';
import AppointmentCard from '../components/patient/AppointmentCard';
import BillingSection from '../components/patient/BillingSection';

const SOCKET_URL = 'https://dwo-final.onrender.com';
const API_URL = 'https://dwo-final.onrender.com/api/patient';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('current'); // 'current' or 'history'
    
    const token = localStorage.getItem('token');
    const user = React.useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const { addToast, toggleDrawer } = useNotifications();

    useEffect(() => {
        if (!token || user?.role !== 'Patient') {
            navigate('/');
            return;
        }

        fetchDashboardData();
        fetchHistory();

        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            socket.emit('join_room', { role: 'Patient', id: user._id });
        });

        socket.on('nurse:assigned', () => fetchDashboardData());
        socket.on('visit:confirmed', () => fetchDashboardData());
        socket.on('vitals:collected', () => {
            addToast({ type: 'success', message: 'Vitals collected! Please pick a doctor.' });
            fetchDashboardData();
        });
        socket.on('consultation:completed', () => {
            addToast({ type: 'info', message: 'Consultation finished. Bill generated.' });
            fetchDashboardData();
            fetchHistory();
        });
        socket.on('patient:discharged', () => {
            addToast({ type: 'success', message: 'You have been discharged.' });
            fetchDashboardData();
        });

        // Admin reminder — show urgent toast for 5s and note is already stored in DB
        socket.on('admin:reminder', (note) => {
            addToast({ type: 'urgent', message: note.message, senderName: 'MedPlus Admin', duration: 5000 });
        });

        return () => socket.disconnect();
    }, [token, user, navigate]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard`, {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) setData(await res.json());
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/history`, {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) setHistory(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleIssueSubmit = async (issueText) => {
        try {
            const res = await fetch(`${API_URL}/submit-issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ description: issueText })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Symptoms submitted. Nurse assigned.' });
                fetchDashboardData();
            }
        } catch (err) { console.error(err); }
    };

    const handleConfirmVisitTime = async (date, time) => {
        try {
            const res = await fetch(`${API_URL}/book-nurse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ date, time })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Visit time confirmed!' });
                fetchDashboardData();
            } else {
                const errResult = await res.json();
                const rawError = errResult?.error || '';
                const normalizedError = String(rawError).toLowerCase();
                const message = normalizedError.includes('not in the nurse schedule')
                    ? 'That slot is no longer available. Please choose another free slot.'
                    : (errResult.error || 'Unable to book that time slot.');
                addToast({ type: 'urgent', message });
                fetchDashboardData();
            }
        } catch (err) { console.error(err); }
    };

    const handleSelectDoctor = async (doctorId, date, time) => {
        try {
            const res = await fetch(`${API_URL}/choose-doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ doctorId, date, time })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Doctor selection confirmed!' });
                fetchDashboardData();
            }
        } catch (err) { console.error(err); }
    };

    const handlePayBill = async (amount, method) => {
        try {
            const res = await fetch('https://dwo-final.onrender.com/api/patient/pay-bill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ amount, method })
            });
            if (res.ok) {
                addToast({ type: 'success', message: method === 'cash' ? 'Cash payment initiated!' : 'Payment completed successfully!' });
                fetchDashboardData();
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
            <Activity size={40} color="#2563EB" style={{ animation: 'pulse 2s infinite' }} />
        </div>
    );

    if (!data) return <div>Error loading data.</div>;

    const {
        status, assignedNurse, assignedDoctor, nurseVisit, doctorVisit,
        vitals, doctorFeedback, prescriptions, billing, notifications, profile, visitHistory
    } = data;

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Top Nav */}
            <nav style={{ background: '#FFFFFF', padding: '20px 40px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0 }}>MedPlus<span style={{ color: '#2563EB' }}>+</span></h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={toggleDrawer}>
                        <Bell size={22} color="#64748B" />
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', background: '#EF4444', color: 'white', borderRadius: '50%', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>{unreadCount}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid #E2E8F0' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile?.name}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>ID: {profile?.id?.slice(-6).toUpperCase()}</div>
                        </div>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#94A3B8' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Tab Switcher */}
            <div style={{ maxWidth: '1200px', margin: '40px auto 32px auto', padding: '0 20px', display: 'flex', gap: '32px', borderBottom: '1px solid #E2E8F0' }}>
                <button 
                    onClick={() => setTab('current')}
                    style={{ padding: '12px 20px', border: 'none', background: 'none', fontSize: '15px', fontWeight: 800, color: tab === 'current' ? '#2563EB' : '#64748B', borderBottom: tab === 'current' ? '3px solid #2563EB' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Current Treatment
                </button>
                <button 
                    onClick={() => setTab('history')}
                    style={{ padding: '12px 20px', border: 'none', background: 'none', fontSize: '15px', fontWeight: 800, color: tab === 'history' ? '#2563EB' : '#64748B', borderBottom: tab === 'history' ? '3px solid #2563EB' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Medical History
                </button>
            </div>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px 20px' }}>
                {tab === 'current' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '40px' }}>
                        {/* Sidebar: Status & Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <StatusCard currentStatus={status} assignedNurse={assignedNurse} />
                            
                            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0' }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Upcoming Schedule</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <AppointmentCard visit={nurseVisit} label="Vitals Visit" icon={<Activity size={18} />} />
                                    {assignedDoctor && (
                                        <AppointmentCard visit={doctorVisit} label={`Dr. ${assignedDoctor.name}`} icon={<Stethoscope size={18} />} subtext={assignedDoctor.specialization} />
                                    )}
                                </div>
                            </div>

                            <BillingSection billing={billing} onPay={handlePayBill} />
                        </div>

                        {/* Main Interaction Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            
                            {/* Stage: Registered – Issue Submission or Rebook Banner */}
                            {status === 'registered' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {visitHistory && visitHistory.length > 0 && (
                                        <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '52px', height: '52px', background: '#2563EB', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                                <CheckCircle2 size={26} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#1E40AF', fontWeight: 800, fontSize: '16px' }}>Welcome Back! 👋</h4>
                                                <p style={{ margin: '4px 0 0 0', color: '#3B82F6', fontSize: '14px', fontWeight: 500 }}>
                                                    You have <strong>{visitHistory.length} previous visit(s)</strong> on record. Describe your new symptoms below to start a fresh consultation.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <IssueSubmission issue={null} onSubmit={handleIssueSubmit} />
                                </div>
                            )}

                            {/* Stage: Nurse Visit Scheduling / Observation */}
                            {['pending_vitals', 'vitals_scheduled'].includes(status) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {!nurseVisit?.time && (
                                        <div style={{ background: '#EFF6FF', padding: '24px', borderRadius: '24px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <Activity size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#1E40AF', fontWeight: 800 }}>Nurse Assigned</h4>
                                                <p style={{ margin: 0, color: '#1E3A8A', fontSize: '14px' }}><strong>Nurse {assignedNurse?.name}</strong> is ready for your entry check. Please confirm a slot.</p>
                                            </div>
                                        </div>
                                    )}
                                    <NurseCard nurse={assignedNurse} visit={nurseVisit} onConfirmTime={handleConfirmVisitTime} />
                                </div>
                            )}

                            {/* Stage: Vitals Collected -> Choose Specialist */}
                            {status === 'vitals_collected' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '24px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#065F46', fontWeight: 800 }}>Vitals Recorded</h4>
                                            <p style={{ margin: 0, color: '#15803D', fontSize: '14px' }}>Initial checkup complete. You can now choose your specialist.</p>
                                        </div>
                                    </div>
                                    <VitalsCard vitals={vitals} />
                                    <DoctorSelector onSelect={handleSelectDoctor} />
                                </div>
                            )}

                            {/* Stage: In Doctor Queue */}
                            {status === 'doctor_pending' && (
                                <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '60px 40px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', margin: '0 auto 24px auto' }}>
                                        <Stethoscope size={40} />
                                    </div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>In Doctor's Queue</h2>
                                    <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6, fontSize: '16px' }}>
                                        You are currently waiting for <strong>Dr. {assignedDoctor?.name}</strong>. Please stay in the lounge; the doctor will see you at <strong>{doctorVisit?.time}</strong>.
                                    </p>
                                </div>
                            )}

                            {/* Stage: Billing & Pharmacy */}
                            {status === 'billing_pending' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {data.pharmacyStatus === 'ready_for_collection' && (
                                        <div style={{ background: '#FFF7ED', padding: '24px', borderRadius: '20px', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', background: '#F97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <Pill size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#9A3412', fontWeight: 800 }}>Visit Complete & Prescription Ready</h4>
                                                <p style={{ margin: 0, color: '#C2410C', fontSize: '14px' }}>Please settle the dues and collect your medicines from the nurse station.</p>
                                            </div>
                                        </div>
                                    )}
                                    <FeedbackSection feedbackList={[{ notes: doctorFeedback, doctorName: assignedDoctor?.name, date: new Date().toISOString() }]} />
                                    <PrescriptionSection prescriptions={prescriptions} />
                                    <PaymentBox billing={billing} onPaymentComplete={fetchDashboardData} />
                                </div>
                            )}

                            {/* Stage: Discharged — show completion summary + restart option */}
                            {status === 'discharged' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Discharge confirmation banner */}
                                    <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', padding: '28px', borderRadius: '24px', border: '1px solid #6EE7B7', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ width: '52px', height: '52px', background: '#10B981', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                            <CheckCircle size={28} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#065F46', fontWeight: 900, fontSize: '18px' }}>Visit Complete — You've been discharged! 🎉</h4>
                                            <p style={{ margin: '6px 0 0', color: '#047857', fontSize: '14px', fontWeight: 500 }}>
                                                Your visit summary has been saved to <strong>Medical History</strong>. If you have new symptoms, you can start a fresh consultation below.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Previous visit summary */}
                                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0' }}>
                                        <h4 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Last Visit Summary</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {assignedNurse && (
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', background: '#F5F3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16} color="#7C3AED" /></div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Assigned Nurse</div>
                                                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{assignedNurse.name}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {assignedDoctor && (
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', background: '#EFF6FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Stethoscope size={16} color="#2563EB" /></div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Consulting Doctor</div>
                                                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>Dr. {assignedDoctor.name} · {assignedDoctor.specialization}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {doctorFeedback && (
                                                <div style={{ padding: '12px 16px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>Doctor's Feedback</div>
                                                    <div style={{ fontSize: '14px', color: '#78350F', fontWeight: 500 }}>{doctorFeedback}</div>
                                                </div>
                                            )}
                                            {prescriptions && prescriptions.length > 0 && (
                                                <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>Prescriptions ({prescriptions.length})</div>
                                                    {prescriptions.map((rx, i) => (
                                                        <div key={i} style={{ fontSize: '13px', color: '#15803D', fontWeight: 600, marginBottom: '4px' }}>
                                                            • {rx.name} — {rx.type} {rx.dosage && `(${rx.dosage})`}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>START A NEW VISIT</span>
                                        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                                    </div>

                                    {/* Fresh symptom submission */}
                                    <IssueSubmission issue={null} onSubmit={handleIssueSubmit} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <VisitHistory history={visitHistory} />
                )}
            </main>
        </div>
    );
};

export default PatientDashboard;
