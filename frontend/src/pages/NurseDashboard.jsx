import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { LogOut, Activity, Stethoscope } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { getTemplate } from '../components/notifications/messageTemplates';
import PatientQueue from '../components/nurse/PatientQueue';
import AppointmentBooker from '../components/nurse/AppointmentBooker';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/nurse';

const NurseDashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token || user?.role !== 'Nurse') {
            navigate('/');
            return;
        }

        fetchDashboard();
        fetchPatients();

        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            console.log('Nurse connected to WebSocket');
            socket.emit('join_room', { role: 'Nurse', id: user._id });
        });

        socket.on('patient:new', (payload) => {
            addToast({ type: 'info', message: `New patient ${payload.patient.name} assigned.` });
            fetchPatients();
        });

        socket.on('visit:time:confirmed', () => fetchPatients());
        socket.on('tests:required', () => fetchPatients());
        socket.on('prescription:assigned', () => fetchPatients());
        socket.on('bill:pending', () => fetchPatients());
        socket.on('patient:discharged', (payload) => {
            if (selectedPatient?.id === payload.patientId) setSelectedPatient(null);
            fetchPatients();
        });
        socket.on('appointment:cancelled', () => fetchPatients());

        return () => socket.disconnect();
    }, [token, user, navigate, addToast, selectedPatient]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) setProfile((await res.json()).profile);
        } catch (err) { console.error(err); }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch(`${API_URL}/patients`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
                // Refresh selected patient stats silently
                if (selectedPatient) {
                    const fresh = data.find(p => p.id === selectedPatient.id);
                    if (fresh) setSelectedPatient(fresh);
                }
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleBookAppt = async (patientId, doctorId, date, time) => {
        try {
            const res = await fetch(`${API_URL}/book-appointment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId, doctorId, date, time, room: 'Room 101' })
            });
            if (res.ok) {
                const result = await res.json();
                addToast({ type: 'success', message: 'Appointment booked successfully' });
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
            {/* Top Navigation */}
            <nav style={{ background: '#FFFFFF', padding: '20px 40px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.5px' }}>
                        Nurse Workspace
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>{profile.ward} &middot; Contact: {profile.contact}</div>
                    </div>
                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '24px' }}>
                
                {/* Left Col: Queue */}
                <div style={{ height: 'calc(100vh - 160px)' }}>
                    <PatientQueue patients={patients} selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
                </div>

                {/* Right Col: Workspace */}
                {selectedPatient ? (
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', height: 'min-content' }}>
                        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>{selectedPatient.name}</h2>
                                    <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                        <span style={{ padding: '4px 12px', background: '#DBEAFE', color: '#1D4ED8', borderRadius: '20px', fontWeight: 600, fontSize: '12px', textTransform: 'capitalize' }}>
                                            {selectedPatient.status.replace(/_/g, ' ')}
                                        </span>
                                        &middot; ID: {selectedPatient.id.slice(-6).toUpperCase()} &middot; Phone: {selectedPatient.phone}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Issue Details */}
                        <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Reported Symptoms</h3>
                            <p style={{ margin: 0, fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>"{selectedPatient.issue?.description}"</p>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '12px', fontWeight: 500 }}>
                                Submitted: {new Date(selectedPatient.issue?.submittedAt).toLocaleString()}
                            </div>
                        </div>

                        {/* Actions available depending on status */}
                        {selectedPatient.status === 'nurse_assigned' && (
                            <AppointmentBooker patient={selectedPatient} onBook={handleBookAppt} />
                        )}

                        {selectedPatient.status === 'appointment_scheduled' && (
                            <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #CBD5E1', borderRadius: '12px', color: '#64748B' }}>
                                <Stethoscope size={32} color="#94A3B8" style={{ margin: '0 auto 16px auto' }} />
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#334155' }}>Awaiting Doctor Consultation</h4>
                                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>The doctor will call the patient when ready.</p>
                                {/* Upcoming Appointment display */}
                                {selectedPatient.appointments.length > 0 && (() => {
                                    const appt = selectedPatient.appointments[selectedPatient.appointments.length-1];
                                    return (
                                        <div style={{ marginTop: '16px', display: 'inline-block', background: '#EFF6FF', padding: '12px 24px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                            <strong>Dr. {appt.doctorName}</strong> on {appt.date} at {appt.time}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: '16px', color: '#94A3B8' }}>
                        <Activity size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Select a patient from the queue</h3>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Review symptoms, book appointments, or manage discharge.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NurseDashboard;
