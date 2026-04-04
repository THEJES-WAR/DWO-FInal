import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';

const AppointmentBooker = ({ patient, onBook }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch available doctors (stubbed or from DB)
        // For now, hardcode the seeded doctor for demo if no route exists yet, 
        // to conform to the user's focus on seamless booking.
        fetch('http://localhost:5000/api/admin-new/doctors', {
            headers: { 'x-user': localStorage.getItem('user') } // Borrow admin route for doctors list
        })
        .then(res => res.json())
        .then(data => setDoctors(data?.data || []))
        .catch(err => console.error(err));
    }, []);

    const handleBook = async () => {
        if (!selectedDoc || !date || !time) return;
        setLoading(true);
        await onBook(patient.id, selectedDoc, date, time);
        setLoading(false);
    };

    return (
        <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Book Doctor Appointment</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>Select Doctor</label>
                    <select 
                        value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    >
                        <option value="">-- Choose --</option>
                        {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialty || 'General'})</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>Date</label>
                    <input 
                        type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>Time</label>
                    <input 
                        type="time" value={time} onChange={e => setTime(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    />
                </div>
            </div>

            <button 
                onClick={handleBook}
                disabled={loading || !selectedDoc || !date || !time}
                style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '8px', border: 'none', background: '#2563EB', color: 'white',
                    fontSize: '14px', fontWeight: 600, cursor: (loading || !selectedDoc || !date || !time) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !selectedDoc || !date || !time) ? 0.6 : 1
                }}
            >
                {loading ? 'Booking...' : <><Calendar size={16} /> Confirm Appointment</>}
            </button>
        </div>
    );
};

export default AppointmentBooker;
