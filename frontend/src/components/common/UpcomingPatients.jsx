import React, { useEffect, useState } from 'react';
import { Clock, User, Calendar, Activity, Stethoscope } from 'lucide-react';

const UpcomingPatients = ({ role }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUpcoming = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const res = await fetch('http://https://dwo-final.onrender.com/api/patient/upcoming', {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcoming();
        const interval = setInterval(fetchUpcoming, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ padding: '20px', color: '#64748B', fontSize: '14px' }}>Loading queue...</div>;

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming Appointments</h3>
                <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 }}>{patients.length} TOTAL</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {patients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                        <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No upcoming appointments</p>
                    </div>
                ) : (
                    patients.map((p) => (
                        <div key={p.id} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: p.type === 'Doctor' ? '#EEF2FF' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.type === 'Doctor' ? '#4F46E5' : '#059669' }}>
                                {p.type === 'Doctor' ? <Stethoscope size={20} /> : <Activity size={20} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                                    <Clock size={12} /> {p.time} &middot; {p.status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpcomingPatients;
