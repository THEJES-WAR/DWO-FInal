import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
    LogOut, User, Activity, Clock, FileText, Pill,
    CheckCircle2, AlertTriangle, ChevronRight, Beaker, Plus, X, Stethoscope, Info, Bell
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import UpcomingPatients from '../components/common/UpcomingPatients';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/doctor';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { addToast, toggleDrawer } = useNotifications();
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeQueueTab, setActiveQueueTab] = useState('waiting');

    const [feedback, setFeedback] = useState('');
    const [prescriptions, setPrescriptions] = useState([]);
    const [noMedicine, setNoMedicine] = useState(false);

    // New Medication State
    const [newMed, setNewMed] = useState({
        name: '',
        type: 'Tablet',
        morning: false,
        afternoon: false,
        night: false,
        beforeFood: false,
        afterFood: false,
        dosage: '',
        duration: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token || user?.role !== 'Doctor') {
            navigate('/');
            return;
        }

        fetchDashboard();
        fetchPatients();

        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            socket.emit('join_room', { role: 'Doctor', id: user._id });
        });

        socket.on('patient:queued', () => fetchPatients());

        return () => socket.disconnect();
    }, [token, user, navigate]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) setProfile((await res.json()).profile);
        } catch (err) { console.error(err); }
    };

    const fetchPatients = async (preventReselect = false) => {
        try {
            const res = await fetch(`${API_URL}/patients`, { headers: { 'x-user': JSON.stringify(user) } });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
                if (selectedPatient && !preventReselect) {
                    const fresh = data.find(p => p.id === selectedPatient.id);
                    if (fresh) setSelectedPatient(fresh);
                }
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAddMed = () => {
        if (!newMed.name) return;
        setPrescriptions([...prescriptions, { ...newMed }]);
        setNewMed({
            name: '', type: 'Tablet', morning: false, afternoon: false, night: false,
            beforeFood: false, afterFood: false, dosage: '', duration: ''
        });
    };

    const handleCompleteConsultation = async () => {
        if (!feedback) return addToast({ type: 'urgent', message: 'Please enter consultation feedback.' });
        try {
            const res = await fetch(`${API_URL}/complete-consultation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId: selectedPatient.id, feedback, prescriptions, noMedicine })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Consultation completed. Bill generated.' });
                setFeedback('');
                setPrescriptions([]);
                setNoMedicine(false);
                setSelectedPatient(null);
                fetchPatients(true);
            }
        } catch (err) { console.error(err); }
    };

    if (loading || !profile) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
            <Activity size={40} color="#6366F1" style={{ animation: 'pulse 2s infinite' }} />
        </div>
    );

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const waitingPatients = patients.filter(p => !['billing_pending', 'pharmacy_pending', 'payment_completed', 'discharged'].includes(p.status));
    const historyPatients = patients.filter(p => ['billing_pending', 'pharmacy_pending', 'payment_completed', 'discharged'].includes(p.status));
    const displayPatients = activeQueueTab === 'waiting' ? waitingPatients : historyPatients;

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

            {/* Top Nav */}
            <nav style={{ background: '#FFFFFF', padding: '20px 40px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0 }}>MedPlus<span style={{ color: '#6366F1' }}>+</span> <span style={{ color: '#94A3B8', fontWeight: 400 }}>Doctor Workspace</span></h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>{profile.specialty}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={toggleDrawer} style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#64748B' }}>
                            <Bell size={20} />
                        </button>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#64748B' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '350px 1fr 350px', gap: '32px', height: 'calc(100vh - 100px)' }}>

                {/* Left Queue */}
                <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                        <button 
                            onClick={() => setActiveQueueTab('waiting')}
                            style={{ flex: 1, padding: '20px', border: 'none', background: activeQueueTab === 'waiting' ? '#FFFFFF' : 'transparent', color: activeQueueTab === 'waiting' ? '#6366F1' : '#64748B', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: activeQueueTab === 'waiting' ? '2px solid #6366F1' : 'none' }}
                        >Waiting ({waitingPatients.length})</button>
                        <button 
                            onClick={() => setActiveQueueTab('history')}
                            style={{ flex: 1, padding: '20px', border: 'none', background: activeQueueTab === 'history' ? '#FFFFFF' : 'transparent', color: activeQueueTab === 'history' ? '#6366F1' : '#64748B', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: activeQueueTab === 'history' ? '2px solid #6366F1' : 'none' }}
                        >History ({historyPatients.length})</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {displayPatients.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                                <User size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontSize: '13px' }}>No patients in {activeQueueTab}</p>
                            </div>
                        ) : (
                            displayPatients.map(p => (
                                <div
                                    key={p.id} onClick={() => setSelectedPatient(p)}
                                    style={{
                                        padding: '16px', borderRadius: '16px', border: '1px solid',
                                        borderColor: selectedPatient?.id === p.id ? '#6366F1' : '#F1F5F9',
                                        background: selectedPatient?.id === p.id ? '#F5F3FF' : '#FFFFFF',
                                        cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s',
                                        opacity: activeQueueTab === 'history' ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ fontWeight: 800, color: '#1E293B' }}>{p.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <Clock size={12} /> {p.doctorVisit?.time || 'ASAP'}
                                    </div>
                                    {activeQueueTab === 'history' && (
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', marginTop: '8px', textTransform: 'uppercase' }}>
                                            {p.status.replace(/_/g, ' ')}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Workspace */}
                <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '40px', border: '1px solid #E2E8F0', overflowY: 'auto' }}>
                    {selectedPatient ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '24px' }}>
                                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>{selectedPatient.name}</h2>
                                <p style={{ margin: '8px 0 0 0', color: '#64748B' }}>Primary Issue: <strong style={{ color: '#1E293B' }}>{selectedPatient.issue?.description}</strong></p>
                            </div>

                            {selectedPatient.vitals && (
                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                    {['BP', 'Sugar', 'Heart Rate', 'Temp'].map((label, idx) => {
                                        const keys = ['bp', 'sugar', 'heartRate', 'temperature'];
                                        return (
                                            <div key={label}>
                                                <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</label>
                                                <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedPatient.vitals[keys[idx]] || '--'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Main Form */}
                            {activeQueueTab === 'history' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>Doctor's Feedback</h3>
                                        <div style={{ color: '#475569', fontSize: '15px' }}>{selectedPatient.doctorFeedback || 'No specific feedback provided.'}</div>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Prescribed Medications</h3>
                                        {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {selectedPatient.prescriptions.map((m, i) => (
                                                    <div key={i} style={{ background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <span style={{ fontWeight: 800 }}>{m.name}</span> &middot; <span style={{ fontSize: '12px', color: '#64748B' }}>{m.dosage} ({m.type})</span>
                                                            <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: 700, marginTop: '2px' }}>
                                                                {[m.morning && 'M', m.afternoon && 'A', m.night && 'N'].filter(Boolean).join('-')} | {m.beforeFood ? 'Before Food' : 'After Food'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ color: '#94A3B8', fontSize: '14px', fontStyle: 'italic' }}>No medicines prescribed.</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '12px', display: 'block' }}>Consultation Feedback (Observations)</label>
                                        <textarea
                                            value={feedback} onChange={e => setFeedback(e.target.value)}
                                            placeholder="Enter patient diagnosis and general advice..."
                                            style={{ width: '100%', height: '120px', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Medicinal Requirements</h3>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#64748B' }}>
                                                <input type="checkbox" checked={noMedicine} onChange={e => setNoMedicine(e.target.checked)} />
                                                No Medicines (Only Consultation)
                                            </label>
                                        </div>

                                        {!noMedicine && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                                                        <input placeholder="Medicine Name" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                                                        <select value={newMed.type} onChange={e => setNewMed({ ...newMed, type: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                            <option>Tablet</option><option>Syrup</option><option>Inhaler</option><option>Drops</option>
                                                        </select>
                                                        <input placeholder={newMed.type === 'Syrup' || newMed.type === 'Drops' ? "Dosage (e.g. 10ml)" : "Dosage (e.g. 500mg)"} value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '10px 0' }}>
                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                            {['Morning', 'Afternoon', 'Night'].map(t => (
                                                                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                                                                    <input type="checkbox" checked={newMed[t.toLowerCase()]} onChange={e => setNewMed({ ...newMed, [t.toLowerCase()]: e.target.checked })} /> {t}
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <div style={{ borderLeft: '1px solid #E2E8F0', height: '24px' }}></div>
                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                            {['Before Food', 'After Food'].map(f => (
                                                                <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                                                                    <input type="radio" name="food" checked={f === 'Before Food' ? newMed.beforeFood : newMed.afterFood} onClick={() => setNewMed({ ...newMed, beforeFood: f === 'Before Food', afterFood: f === 'After Food' })} /> {f}
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <button onClick={handleAddMed} style={{ marginLeft: 'auto', background: '#6366F1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Add Medicine</button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {prescriptions.map((m, i) => (
                                                        <div key={i} style={{ background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <span style={{ fontWeight: 800 }}>{m.name}</span> &middot; <span style={{ fontSize: '12px', color: '#64748B' }}>{m.dosage} ({m.type})</span>
                                                                <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: 700, marginTop: '2px' }}>
                                                                    {[m.morning && 'M', m.afternoon && 'A', m.night && 'N'].filter(Boolean).join('-')} | {m.beforeFood ? 'Before Food' : 'After Food'}
                                                                </div>
                                                            </div>
                                                            <X size={16} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => setPrescriptions(prescriptions.filter((_, idx) => idx !== i))} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCompleteConsultation}
                                        style={{ background: '#1E293B', color: 'white', padding: '20px', borderRadius: '16px', border: 'none', fontSize: '18px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                                    >
                                        <CheckCircle2 size={24} /> Submit & Complete Patient
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#CBD5E1' }}>
                            <Stethoscope size={80} style={{ marginBottom: '24px', opacity: 0.5 }} />
                            <h2 style={{ margin: 0, color: '#94A3B8' }}>Patient Workspace</h2>
                            <p>Select a waiting patient to begin consultation.</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div style={{ height: '100%' }}>
                    {activeQueueTab === 'history' && selectedPatient?.billing ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={20} color="#6366F1" /> Bill Summary
                            </h3>
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748B' }}>
                                    <span>Consultation Fee</span>
                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>${selectedPatient.billing.consultationFee}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748B' }}>
                                    <span>Medicines</span>
                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>${selectedPatient.billing.medicinesTotal}</span>
                                </div>
                                <div style={{ borderTop: '2px solid #E2E8F0', margin: '12px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>
                                    <span>Total</span>
                                    <span>${selectedPatient.billing.total}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: selectedPatient.status === 'payment_completed' || selectedPatient.status === 'discharged' ? '#10B981' : '#F59E0B', textAlign: 'center', background: selectedPatient.status === 'payment_completed' || selectedPatient.status === 'discharged' ? '#D1FAE5' : '#FEF3C7', padding: '8px', borderRadius: '8px', marginTop: 'auto' }}>
                                STATUS: {selectedPatient.status.replace(/_/g, ' ').toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <UpcomingPatients role="Doctor" />
                    )}
                </div>

            </main>
        </div>
    );
};

export default DoctorDashboard;
