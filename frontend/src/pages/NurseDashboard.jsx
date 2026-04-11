import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { LogOut, Activity, Stethoscope, CheckCircle2, CreditCard, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import PatientQueue from '../components/nurse/PatientQueue';
import VitalsForm from '../components/nurse/VitalsForm';
import DischargePanel from '../components/nurse/DischargePanel';
import VitalsCard from '../components/patient/VitalsCard';
import AppointmentBooker from '../components/nurse/AppointmentBooker';
import PharmacyView from '../components/nurse/PharmacyView';
import UpcomingPatients from '../components/common/UpcomingPatients';
import { SOCKET_URL, apiUrl } from '../utils/api';

const API_URL = apiUrl('/nurse');
const getPatientId = (patient) => patient?.id || patient?._id || '';
const needsVitals = (patient) => ['pending_vitals', 'vitals_scheduled'].includes(patient?.status);

const NurseDashboard = () => {
    const navigate = useNavigate();
    const { addToast, toggleDrawer, notifications } = useNotifications();
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [isEditingVitals, setIsEditingVitals] = useState(false);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const user = React.useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const selectedPatient = React.useMemo(() => {
        if (!patients.length) return null;
        return (
            patients.find((patient) => getPatientId(patient) === selectedPatientId) ||
            patients.find(needsVitals) ||
            patients[0] ||
            null
        );
    }, [patients, selectedPatientId]);

    useEffect(() => {
        if (!token || user?.role !== 'Nurse') {
            navigate('/');
            return;
        }

        fetchDashboard();
        fetchPatients();

        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            socket.emit('join_room', { role: 'Nurse', id: user?._id });
        });

        socket.on('patient:assigned', () => fetchPatients());
        socket.on('visit:confirmed', () => fetchPatients());
        socket.on('bill:pending', () => fetchPatients());
        socket.on('bill:paid', (payload) => {
            addToast({ type: 'success', message: `Patient ${payload.patientName} paid ₹${payload.amount}.` });
            fetchPatients();
        });

        // Admin reminder
        socket.on('admin:reminder', (note) => {
            addToast({ type: 'urgent', message: note.message, senderName: 'MedPlus Admin', duration: 5000 });
        });

        return () => socket.disconnect();
    }, [token, user, navigate]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) {
                const d = await res.json();
                setProfile(d.profile || { name: user?.name || 'Nurse', ward: 'General' });
            } else {
                setProfile({ name: user?.name || 'Nurse', ward: 'General' });
            }
        } catch (err) { 
            console.error(err); 
            setProfile({ name: user?.name || 'Nurse', ward: 'General' });
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch(`${API_URL}/patients`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatientId(getPatientId(patient));
        setIsEditingVitals(needsVitals(patient));
    };

    useEffect(() => {
        if (!selectedPatient) {
            setIsEditingVitals(false);
            return;
        }

        setIsEditingVitals(needsVitals(selectedPatient));
    }, [selectedPatient]);

    const handleDischarge = async (patientId) => {
        try {
            const res = await fetch(`${API_URL}/discharge-patient`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Patient discharged successfully.' });
                setSelectedPatientId(null);
                fetchPatients();
            }
        } catch (err) { console.error(err); }
    };

    if (loading || !profile) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
            <Activity size={40} color="#8B5CF6" style={{ animation: 'pulse 2s infinite' }} />
        </div>
    );

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Top Nav */}
            <nav style={{ background: '#FFFFFF', padding: '20px 40px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0 }}>MedPlus<span style={{ color: '#8B5CF6' }}>+</span> <span style={{ fontWeight: 400, color: '#94A3B8' }}>Nurse Portal</span></h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>Ward: {profile.ward}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={toggleDrawer} 
                            style={{ 
                                background: '#F1F5F9', border: 'none', padding: '10px', 
                                borderRadius: '10px', cursor: 'pointer', color: unreadCount > 0 ? '#8B5CF6' : '#64748B',
                                position: 'relative'
                            }}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{ 
                                    position: 'absolute', top: '-5px', right: '-5px', 
                                    background: '#EF4444', border: '2px solid #FFFFFF', 
                                    borderRadius: '50%', padding: '2px 6px', fontSize: '10px', 
                                    color: 'white', fontWeight: 900 
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#64748B' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '350px 1fr 350px', gap: '32px', height: 'calc(100vh - 100px)' }}>
                
                <div style={{ height: '100%' }}>
                    <PatientQueue patients={patients} selectedPatient={selectedPatient} onSelect={handleSelectPatient} />
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '40px', border: '1px solid #E2E8F0', overflowY: 'auto' }}>
                    {selectedPatient ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{selectedPatient.name}</h2>
                                        <div style={{ fontSize: '14px', color: '#8B5CF6', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Status: {(selectedPatient.status || 'unknown').replace(/_/g, ' ')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>ID: {getPatientId(selectedPatient).slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            {['pending_vitals', 'vitals_scheduled'].includes(selectedPatient.status) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div 
                                        onClick={() => setIsEditingVitals(true)}
                                        style={{ 
                                            background: selectedPatient.status === 'vitals_scheduled' ? '#F5F3FF' : '#FFFBEB', 
                                            padding: '24px', borderRadius: '16px', border: '1px solid', 
                                            borderColor: selectedPatient.status === 'vitals_scheduled' ? '#DDD6FE' : '#FDE68A',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s ease'
                                        }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
                                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <h4 style={{ margin: '0 0 8px 0', color: selectedPatient.status === 'vitals_scheduled' ? '#7C3AED' : '#B45309', fontWeight: 800 }}>
                                            {selectedPatient.status === 'vitals_scheduled' ? 'Vitals Scheduled' : 'Vitals Collection Required'}
                                        </h4>
                                        <p style={{ margin: 0, color: selectedPatient.status === 'vitals_scheduled' ? '#6D28D9' : '#92400E', fontSize: '15px' }}>
                                            {selectedPatient.status === 'vitals_scheduled' 
                                                ? `Patient Visit: ${selectedPatient.nurseVisit?.time} on ${selectedPatient.nurseVisit?.date}`
                                                : 'The patient is ready for vitals collection. You can either schedule a slot or collect them immediately.'
                                            }
                                        </p>
                                    </div>
                                    
                                    <VitalsForm 
                                        patient={selectedPatient} 
                                        onComplete={() => { setIsEditingVitals(false); fetchPatients(); }} 
                                        initialVitals={isEditingVitals ? selectedPatient.vitals : null}
                                    />

                                    {selectedPatient.status === 'pending_vitals' && (
                                        <div style={{ marginTop: '16px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                                            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Alternatively, schedule a specific time for the patient:</p>
                                            <AppointmentBooker patient={selectedPatient} onBook={fetchPatients} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedPatient.status === 'vitals_collected' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '16px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontWeight: 800 }}>Vitals Collection Complete</h4>
                                            <p style={{ margin: 0, color: '#15803D', fontSize: '15px' }}>
                                                Check-in process completed. The patient has been moved to doctor selection.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingVitals(!isEditingVitals)}
                                            style={{ background: '#FFFFFF', color: '#166534', border: '1px solid #BBF7D0', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {isEditingVitals ? 'Cancel Edit' : 'Edit Vitals'}
                                        </button>
                                    </div>
                                    
                                    {isEditingVitals ? (
                                        <VitalsForm 
                                            patient={selectedPatient} 
                                            onComplete={() => { setIsEditingVitals(false); fetchPatients(); }} 
                                            initialVitals={selectedPatient.vitals}
                                        />
                                    ) : (
                                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', color: '#1E293B' }}>
                                            <div><strong style={{ color: '#64748B' }}>BP:</strong> {selectedPatient.vitals?.bp}</div>
                                            <div><strong style={{ color: '#64748B' }}>Sugar:</strong> {selectedPatient.vitals?.sugar}</div>
                                            <div><strong style={{ color: '#64748B' }}>HR:</strong> {selectedPatient.vitals?.heartRate} <span style={{ color: '#94A3B8' }}>/</span> <strong style={{ color: '#64748B' }}>Temp:</strong> {selectedPatient.vitals?.temperature}</div>
                                            <div><strong style={{ color: '#64748B' }}>O2:</strong> {selectedPatient.vitals?.oxygenSaturation}</div>
                                        </div>
                                    )}
                                    <AppointmentBooker 
                                        patient={selectedPatient} 
                                        onBook={async (pId, docId, date, time) => {
                                            const user = JSON.parse(localStorage.getItem('user'));
                                            const res = await fetch(apiUrl('/patient/choose-doctor'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                                                body: JSON.stringify({ patientId: pId, doctorId: docId, date, time })
                                            });
                                            if (res.ok) fetchPatients();
                                        }} 
                                    />
                                </div>
                            )}

                            {selectedPatient.status === 'doctor_pending' && (
                                <div style={{ background: '#EFF6FF', padding: '32px', borderRadius: '20px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                                    <Stethoscope size={48} color="#2563EB" style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E40AF', margin: '0 0 8px 0' }}>Consultation In Progress</h3>
                                    <p style={{ color: '#1E3A8A', margin: '0 0 24px 0' }}>The patient is currently with <strong>Dr. {selectedPatient.assignedDoctor?.name || 'the specialist'}</strong>.</p>
                                    <div style={{ display: 'inline-block', padding: '12px 24px', background: 'white', borderRadius: '12px', border: '1px solid #DBEAFE', fontWeight: 700, color: '#2563EB' }}>
                                        Current Phase: Doctor Consultation
                                    </div>
                                </div>
                            )}

                            {selectedPatient.status === 'discharged' && (
                                <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                    <CheckCircle2 size={48} color="#94A3B8" style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#475569', margin: '0 0 8px 0' }}>Patient Discharged</h3>
                                    <p style={{ color: '#64748B', margin: '0 0 24px 0' }}>This patient has completed their visit and has been discharged from active care.</p>
                                    <button onClick={() => setSelectedPatientId(null)} style={{ background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                        Close Details
                                    </button>
                                </div>
                            )}

                            {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                                <PharmacyView prescriptions={selectedPatient.prescriptions} patientId={selectedPatient.id} />
                            )}

                            {selectedPatient.status === 'billing_pending' && (
                                <div style={{ background: '#FFFBEB', padding: '32px', borderRadius: '20px', border: '1px solid #FEF3C7', textAlign: 'center' }}>
                                    <CreditCard size={48} color="#D97706" style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#92400E', margin: '0 0 8px 0' }}>Billing Mentoring</h3>
                                    <p style={{ color: '#B45309', margin: '0 0 24px 0' }}>Awaiting patient payment of <strong>₹{selectedPatient.billing?.totalAmount}</strong>.</p>
                                    <div style={{ display: 'inline-block', padding: '12px 24px', background: 'white', borderRadius: '12px', border: '1px solid #FDE68A', fontWeight: 700, color: '#D97706' }}>
                                        Status: Unpaid
                                    </div>
                                </div>
                            )}

                            {['payment_completed', 'payment_pending_cash'].includes(selectedPatient.status) && (
                                <DischargePanel 
                                    patient={selectedPatient} 
                                    onDischarge={handleDischarge} 
                                    prescribedMedicines={selectedPatient.prescriptions}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94A3B8' }}>
                            <Stethoscope size={64} color="#E2E8F0" style={{ marginBottom: '24px' }} />
                            <h2 style={{ margin: 0, fontWeight: 800 }}>Nurse Workspace</h2>
                            <p>Select a patient to collect vitals or manage discharge.</p>
                        </div>
                    )}
                </div>

                <div style={{ height: '100%' }}>
                    <UpcomingPatients role="Nurse" />
                </div>

            </main>
        </div>
    );
};

export default NurseDashboard;
