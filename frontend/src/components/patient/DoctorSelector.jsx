import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, ChevronRight, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DEFAULT_SLOTS } from '../../utils/availability';

const DoctorSelector = ({ onSelect }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [fetching, setFetching] = useState(true);
    const [specialization, setSpecialization] = useState('');
    const [availableSpecializations, setAvailableSpecializations] = useState([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        const url = new URL('http://https://dwo-final.onrender.com/api/patient/doctor-list');

        fetch(url, { headers: { 'x-user': JSON.stringify(user) } })
            .then(res => res.json())
            .then(data => {
                setDoctors(data);
                const specs = [...new Set(data.filter(d => d.specialization).map(d => d.specialization))];
                setAvailableSpecializations(specs);
                if (specs.length > 0 && !specialization) setSpecialization(specs[0]);
                setFetching(false);
            })
            .catch(err => {
                console.error(err);
                setFetching(false);
            });
    }, []);

    const filteredDoctors = doctors.filter(d => d.specialization === specialization);

    const handleSubmit = () => {
        if (!selectedDoc || !date || !time) return;
        onSelect(selectedDoc.id, date, time);
    };

    if (fetching) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <Activity size={40} color="#2563EB" style={{ animation: 'pulse 2s infinite', marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Finding Available Specialists...</div>
            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>Please wait while we check clinical availability.</p>
        </div>
    );

    if (doctors.length === 0) return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '40px', border: '1px solid #E2E8F0', marginTop: '24px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#94A3B8" style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>No Specialists Available right now</h3>
            <p style={{ color: '#64748B', maxWidth: '400px', margin: '8px auto' }}>All our doctors are currently occupied or the department is closed for the day. Please check back in a few minutes.</p>
        </div>
    );

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', marginTop: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>Select a Specialist</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Choose your desired specialization to see our expert doctors.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {availableSpecializations.map(s => (
                    <button
                        key={s}
                        onClick={() => {
                            setSpecialization(s);
                            setSelectedDoc(null);
                        }}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', border: '1px solid',
                            borderColor: specialization === s ? '#2563EB' : '#E2E8F0',
                            background: specialization === s ? '#2563EB' : '#FFFFFF',
                            color: specialization === s ? 'white' : '#64748B',
                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {specialization !== 'Select Specialization' && (
                <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                    {/* Left: Doctor List */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                        {filteredDoctors.map(doc => (
                            <div 
                                key={doc.id} 
                                onClick={() => {
                                    setSelectedDoc(doc);
                                    const firstAvailDate = doc.availability?.[0]?.date || '';
                                    setDate(firstAvailDate);
                                    const firstAvailSlot = doc.availability?.[0]?.openSlots?.[0] || '';
                                    setTime(firstAvailSlot);
                                }}
                                style={{ 
                                    padding: '24px', borderRadius: '24px', border: '1px solid',
                                    borderColor: selectedDoc?.id === doc.id ? '#2563EB' : '#E2E8F0',
                                    background: selectedDoc?.id === doc.id ? '#F0F7FF' : '#FFFFFF',
                                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                                    boxShadow: selectedDoc?.id === doc.id ? '0 12px 20px -8px rgba(37, 99, 235, 0.15)' : 'none'
                                }}
                            >
                                {selectedDoc?.id === doc.id && (
                                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                        <CheckCircle2 size={24} color="#2563EB" />
                                    </div>
                                )}
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: selectedDoc?.id === doc.id ? '#FFFFFF' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 900, marginBottom: '16px', fontSize: '24px', border: '2px solid #EFF6FF' }}>
                                    {doc.name.charAt(0)}
                                </div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Dr. {doc.name}</h4>
                                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{doc.specialization}</div>
                                
                                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ padding: '4px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> NEXT: {doc.availability?.[0]?.openSlots?.[0] || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Booking Sidebar */}
                    <div style={{ width: '380px', flexShrink: 0, background: '#F8FAFC', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '28px', position: 'sticky', top: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Complete Booking</div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Step 1: Choose Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: 700, color: '#1E293B', outline: 'none', background: 'white' }} 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Step 2: Select Time Slot</label>
                            <div style={{ 
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', 
                                maxHeight: '240px', overflowY: 'auto', padding: '4px'
                            }}>
                                {(() => {
                                    const slots = selectedDoc?.availability?.find(a => a.date === date)?.openSlots || [];
                                    if (slots.length === 0) return <div style={{ gridColumn: 'span 3', padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontStyle: 'italic', background: 'white', borderRadius: '12px' }}>No slots available</div>;
                                    return slots.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setTime(s)}
                                            style={{
                                                padding: '12px 8px', borderRadius: '12px', border: '2px solid',
                                                borderColor: time === s ? '#2563EB' : '#E2E8F0',
                                                background: time === s ? '#2563EB' : '#FFFFFF',
                                                color: time === s ? 'white' : '#1E293B',
                                                fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={!selectedDoc || !date || !time}
                            style={{ 
                                marginTop: '12px', background: '#2563EB', color: 'white', padding: '20px', 
                                borderRadius: '16px', border: 'none', fontWeight: 800, fontSize: '16px',
                                cursor: (!selectedDoc || !date || !time) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)',
                                opacity: (!selectedDoc || !date || !time) ? 0.6 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSelector;
