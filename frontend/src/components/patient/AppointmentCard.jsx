import React from 'react';
import { Calendar, MapPin, Clock, Trash2, RefreshCw } from 'lucide-react';

const AppointmentCard = ({ appointment, onCancel, onReschedule }) => {
    if (!appointment) return null;

    const isCancelled = appointment.status === 'cancelled' || appointment.status === 'Cancelled_By_Patient';
    const isCompleted = appointment.status === 'completed';

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            opacity: isCancelled ? 0.7 : 1
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5E9' }}>
                        {/* Avatar Placeholder */}
                        <span style={{ fontWeight: 800, fontSize: '18px' }}>{appointment.doctorName?.[4] || 'D'}</span>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Dr. {appointment.doctorName}</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>{appointment.specialty}</p>
                    </div>
                </div>
                <div style={{
                    background: isCancelled ? '#FEE2E2' : (isCompleted ? '#F0FDF4' : '#EFF6FF'),
                    color: isCancelled ? '#B91C1C' : (isCompleted ? '#166534' : '#1D4ED8'),
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                }}>
                    {appointment.status.replace(/_/g, ' ')}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                    <Calendar size={16} color="#94A3B8" /> {appointment.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                    <Clock size={16} color="#94A3B8" /> {appointment.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', gridColumn: 'span 2' }}>
                    <MapPin size={16} color="#94A3B8" /> {appointment.room || 'Waiting Hall B'}
                </div>
            </div>

            {!isCancelled && !isCompleted && (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => onReschedule(appointment)}
                        style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={14} /> Reschedule
                    </button>
                    <button
                        onClick={() => onCancel(appointment._id)}
                        style={{ flex: 1, background: '#FFFFFF', border: '1px solid #FEE2E2', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Trash2 size={14} /> Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
