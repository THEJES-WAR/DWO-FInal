import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, Calendar, User, Clock, CheckCircle } from 'lucide-react';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        if (!token || user?.role !== 'Doctor') {
            navigate('/');
            return;
        }
        fetchAppointments();
        const interval = setInterval(fetchAppointments, 3000);
        return () => clearInterval(interval);
    }, [token, user, navigate]);

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`${API_URL}/appointments/doctor-appointments`, {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (loading) setLoading(false);
        }
    };

    const handleEmergency = async () => {
        if (!window.confirm("CRITICAL: This will CANCEL all your upcoming appointments today. Affected patients will be notified. Proceed?")) return;
        
        try {
            const res = await fetch(`${API_URL}/workflow/doctor/unavailable`, {
                method: 'POST',
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) {
                alert("You have been marked unavailable. Appointments cancelled.");
                fetchAppointments(); // Refresh
                user.status = 'Unavailable';
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading Schedule...</div>;

    const bookedAppts = appointments.filter(a => a.status === 'booked');

    return (
        <div className="dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>Doctor Workspace</h1>
                    <p style={{ color: '#6b7280' }}>Welcome, {user.name} ({user.specialization || 'Doctor'})</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={handleEmergency}
                        style={{ 
                            backgroundColor: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', 
                            borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                            border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)' 
                        }}
                    >
                        <AlertTriangle size={20} />
                        Trigger Emergency (Unavailable)
                    </button>
                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid #d1d5db' }}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>Today's Schedule</h2>
                    
                    {bookedAppts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                            <p>No upcoming appointments. Your schedule is clear.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {bookedAppts.map(appt => (
                                <div key={appt._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ backgroundColor: '#ebf5ff', padding: '1rem', borderRadius: '0.5rem', color: '#3b82f6' }}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, margin: 0 }}>{appt.time} - {appt.date}</h3>
                                            <p style={{ color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={14} /> {appt.patientName}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{ padding: '0.5rem 1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Booked
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
