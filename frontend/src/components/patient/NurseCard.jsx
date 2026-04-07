import React, { useEffect, useMemo, useState } from 'react';
import { User, Clock, Check } from 'lucide-react';

const NurseCard = ({ nurse, visit, onConfirmTime }) => {
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!nurse?.id) return;

        const user = JSON.parse(localStorage.getItem('user'));

        const loadAvailability = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://dwo-final.onrender.com/api/patient/nurse-availability/${nurse.id}`, {
                    headers: { 'x-user': JSON.stringify(user) }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAvailability(data.availability || []);
                    if (data.availability?.length > 0 && !selectedDate) {
                        setSelectedDate(data.availability[0].date);
                    }
                    if (visit?.date) setSelectedDate(visit.date);
                    setSelectedTime(visit?.time || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadAvailability();
    }, [nurse?.id, visit?.date, visit?.time]);

    const selectedDateAvailability = useMemo(
        () => availability.find(entry => entry.date === selectedDate),
        [availability, selectedDate]
    );
    const visibleSlots = useMemo(() => {
        if (!selectedDateAvailability) return [];
        return selectedDateAvailability.openSlots || [];
    }, [selectedDateAvailability]);

    if (!nurse) return null;

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', 
            borderRadius: '24px', padding: '32px', color: 'white',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.5), 0 8px 10px -6px rgba(15, 23, 42, 0.4)', 
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#6366F1', opacity: 0.2, borderRadius: '50%', filter: 'blur(50px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: '#10B981', opacity: 0.1, borderRadius: '50%', filter: 'blur(50px)' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <User size={32} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.5px' }}>{nurse.name}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94A3B8', fontWeight: 500 }}>{nurse.ward} &middot; <span style={{ color: '#CBD5E1' }}>{nurse.contact}</span></p>
                    </div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Assigned Primary
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#94A3B8' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {visit?.time ? 'Confirmed Visit Time' : 'Select Visit Time'}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#F8FAFC' }}>
                            {visit?.time ? `${visit.date} at ${visit.time}` : 'Choose from availability below'}
                        </p>
                    </div>
                </div>

                {visit?.time ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 800, fontSize: '15px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px' }}>
                        <Check size={20} /> Confirmed
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontWeight: 800, fontSize: '15px', background: 'rgba(99, 102, 241, 0.1)', padding: '8px 16px', borderRadius: '12px' }}>
                        <Clock size={18} /> Live slots
                    </div>
                )}
            </div>

            {!visit?.time && (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ fontSize: '12px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>Select Available Date</label>
                        <select
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedTime('');
                            }}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                        >
                            <option value="" style={{ color: '#0F172A' }}>Select an open date...</option>
                            {availability.map(entry => (
                                <option key={entry.date} value={entry.date} style={{ color: '#0F172A' }}>
                                    {entry.date} ({entry.openSlots?.length || 0} open slots)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ fontSize: '12px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>Pick a Time Slot</label>
                        {loading ? (
                            <div style={{ fontSize: '14px', color: '#94A3B8' }}>Loading schedule...</div>
                        ) : !selectedDate ? (
                            <div style={{ fontSize: '14px', color: '#64748B' }}>Please select a date from the dropdown first.</div>
                        ) : visibleSlots.length ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {visibleSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedTime(slot)}
                                        style={{
                                            background: selectedTime === slot ? '#6366F1' : 'rgba(255,255,255,0.05)',
                                            color: selectedTime === slot ? '#FFFFFF' : '#CBD5E1',
                                            border: '1px solid',
                                            borderColor: selectedTime === slot ? '#6366F1' : 'rgba(255,255,255,0.1)',
                                            padding: '12px 18px',
                                            borderRadius: '12px',
                                            fontWeight: 800,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedTime === slot ? '0 10px 15px -3px rgba(99, 102, 241, 0.4)' : 'none'
                                        }}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '14px', color: '#EF4444', fontWeight: 700 }}>No free slots available on {selectedDate}.</div>
                        )}
                    </div>

                    <button
                        onClick={() => onConfirmTime(selectedDate, selectedTime)}
                        disabled={!selectedDate || !selectedTime}
                        style={{
                            background: (!selectedDate || !selectedTime) ? 'rgba(255,255,255,0.05)' : '#6366F1',
                            color: (!selectedDate || !selectedTime) ? '#64748B' : 'white',
                            border: 'none',
                            padding: '18px',
                            borderRadius: '16px',
                            fontWeight: 900,
                            fontSize: '16px',
                            cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer',
                            marginTop: '8px',
                            transition: 'all 0.2s',
                            boxShadow: (!selectedDate || !selectedTime) ? 'none' : '0 15px 25px -5px rgba(99, 102, 241, 0.5)'
                        }}
                    >
                        LOCK IN APPOINTMENT
                    </button>
                </div>
            )}
        </div>
    );
};

export default NurseCard;
