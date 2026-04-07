import React, { useState, useEffect } from 'react';
import { RefreshCw, User, Calendar, Clock, ChevronRight, Activity } from 'lucide-react';

const API_URL = 'https://dwo-final.onrender.com/api/patient';

const RebookWidget = ({ onRebookComplete }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            // Reusing the general doctors endpoint if available, or a specific patient one
            const res = await fetch('https://dwo-final.onrender.com/api/nurse/doctors', {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) setDoctors(await res.json());
        } catch (err) { console.error(err); } finally { setFetching(false); }
    };

    const handleRebook = async () => {
        if (!selectedDoc || !date || !time) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/rebook-appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ doctorId: selectedDoc.id, date, time })
            });
            if (res.ok) {
                onRebookComplete();
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    if (fetching) return <div style={{ textAlign: 'center', padding: '20px' }}><Activity size={20} className="animate-spin" /> Fetching available specialists...</div>;

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #F8FAFC, #FFFFFF)', borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} color="#2563EB" /> Find New Doctor & Slot
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748B' }}>Your previous appointment was cancelled. Please select a new specialist.</p>
            </div>

            <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px' }}>
                    
                    {/* Doctor List */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Choose Specialist</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {doctors.map(doc => (
                                <div 
                                    key={doc.id} 
                                    onClick={() => setSelectedDoc(doc)}
                                    style={{ 
                                        padding: '16px', borderRadius: '12px', border: '1px solid',
                                        borderColor: selectedDoc?.id === doc.id ? '#2563EB' : '#F1F5F9',
                                        background: selectedDoc?.id === doc.id ? '#EFF6FF' : '#FFFFFF',
                                        cursor: 'pointer', transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800, fontSize: '12px' }}>D</div>
                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>{doc.name}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{doc.specialty}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date/Time Pickers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94A3B8' }} />
                                <input 
                                    type="date" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px' }} 
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Time Slot</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94A3B8' }} />
                                <input 
                                    type="time" 
                                    value={time} 
                                    onChange={e => setTime(e.target.value)}
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px' }} 
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleRebook}
                            disabled={loading || !selectedDoc || !date || !time}
                            style={{ 
                                marginTop: 'auto', background: '#2563EB', color: 'white', border: 'none', padding: '14px',
                                borderRadius: '12px', fontWeight: 700, cursor: (loading || !selectedDoc || !date || !time) ? 'not-allowed' : 'pointer',
                                opacity: (loading || !selectedDoc || !date || !time) ? 0.6 : 1, transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {loading ? 'Rebooking...' : <><RefreshCw size={18} /> Confirm Rebooking</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RebookWidget;
