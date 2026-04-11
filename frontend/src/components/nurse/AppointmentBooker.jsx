import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, CheckCircle, ChevronDown } from 'lucide-react';
import { apiUrl } from '../../utils/api';

const AppointmentBooker = ({ patient, onBook }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDocId, setSelectedDocId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        fetch(apiUrl('/patient/doctor-list'), {
            headers: { 'x-user': JSON.stringify(user) }
        })
        .then(res => res.json())
        .then(data => {
            setDoctors(Array.isArray(data) ? data : []);
            setFetching(false);
        })
        .catch(err => {
            console.error(err);
            setFetching(false);
        });
    }, []);

    const selectedDoc = useMemo(() => 
        doctors.find(d => d.id === selectedDocId),
        [doctors, selectedDocId]
    );

    const availableDates = useMemo(() => {
        if (!selectedDoc?.availability) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limit = new Date(today);
        limit.setDate(today.getDate() + 3);

        return selectedDoc.availability.filter(a => {
            const d = new Date(a.date);
            return d >= today && d <= limit;
        });
    }, [selectedDoc]);

    const availableSlots = useMemo(() => {
        if (!selectedDoc || !date) return [];
        return availableDates.find(a => a.date === date)?.openSlots || [];
    }, [selectedDoc, date, availableDates]);

    const handleBook = async () => {
        if (!selectedDocId || !date || !time) return;
        setLoading(true);
        // This onBook call should handle the backend logic for nurse-driven booking
        await onBook(patient.id, selectedDocId, date, time);
        setLoading(false);
    };

    const handleAutoBookNurse = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(apiUrl('/nurse/book-patient-slot'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId: patient.id })
            });
            if (res.ok) {
                onBook(); // Refresh parent
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to book slot');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={{ padding: '20px', color: '#64748B' }}>Loading schedules...</div>;

    return (
        <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Clinical Scheduling</h4>
                <button 
                    onClick={handleAutoBookNurse}
                    disabled={loading}
                    style={{ 
                        padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#8B5CF6', color: 'white',
                        fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    {loading ? 'Booking...' : 'Next Immediate Nurse Slot'}
                </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>1. Select Doctor</label>
                    <select 
                        value={selectedDocId} 
                        onChange={e => {
                            setSelectedDocId(e.target.value);
                            setDate('');
                            setTime('');
                        }}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600 }}
                    >
                        <option value="">-- Choose Specialist --</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>2. Select Date</label>
                    <select 
                        value={date} 
                        onChange={e => {
                            setDate(e.target.value);
                            setTime('');
                        }}
                        disabled={!selectedDocId}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600 }}
                    >
                        <option value="">-- Pick a Date --</option>
                        {availableDates.map(a => (
                            <option key={a.date} value={a.date}>{a.date === new Date().toISOString().split('T')[0] ? 'Today' : a.date} ({a.openSlots.filter(s => {
                                if (a.date !== new Date().toISOString().split('T')[0]) return true;
                                const now = new Date();
                                const [h, m] = s.split(':').map(Number);
                                return (h * 60 + m) > (now.getHours() * 60 + now.getMinutes());
                            }).length} free)</option>
                        ))}
                    </select>
                </div>
            </div>

            {date && (
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>3. Pick 30-min Slot</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '180px', overflowY: 'auto', padding: '12px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        {availableSlots.filter(s => {
                            if (date !== new Date().toISOString().split('T')[0]) return true;
                            const now = new Date();
                            const [h, m] = s.split(':').map(Number);
                            return (h * 60 + m) > (now.getHours() * 60 + now.getMinutes());
                        }).length > 0 ? availableSlots.filter(s => {
                            if (date !== new Date().toISOString().split('T')[0]) return true;
                            const now = new Date();
                            const [h, m] = s.split(':').map(Number);
                            return (h * 60 + m) > (now.getHours() * 60 + now.getMinutes());
                        }).map(s => (
                            <button
                                key={s}
                                onClick={() => setTime(s)}
                                style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: time === s ? '#2563EB' : '#F1F5F9',
                                    background: time === s ? '#2563EB' : '#FFFFFF',
                                    color: time === s ? 'white' : '#1E293B',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {s}
                            </button>
                        )) : (
                            <div style={{ gridColumn: 'span 4', textAlign: 'center', py: 2, color: '#94A3B8', fontSize: '13px' }}>No slots available for this day.</div>
                        )}
                    </div>
                </div>
            )}

            <button 
                onClick={handleBook}
                disabled={loading || !selectedDocId || !date || !time}
                style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '20px', borderRadius: '16px', border: 'none', background: '#1E293B', color: 'white',
                    fontSize: '15px', fontWeight: 800, cursor: (loading || !selectedDocId || !date || !time) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !selectedDocId || !date || !time) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.2)'
                }}
            >
                {loading ? 'Processing...' : <><CheckCircle size={20} /> Finalize Specialist Appointment</>}
            </button>
        </div>
    );
};

export default AppointmentBooker;
