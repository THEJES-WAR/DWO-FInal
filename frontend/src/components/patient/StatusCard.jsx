import React from 'react';
import { Activity } from 'lucide-react';

const StatusCard = ({ currentStatus, assignedNurse }) => {
  return (
    <div style={{ 
      background: 'rgba(30, 58, 138, 0.9)', 
      backdropFilter: 'blur(10px)',
      borderRadius: '24px', padding: '32px', 
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
      color: 'white', display: 'flex', flexDirection: 'column', height: '100%',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 16px 0' }}>Patient Journey Status</h3>
      <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 32px 0', textTransform: 'capitalize', letterSpacing: '-0.5px' }}>
        {currentStatus?.replace(/_/g, ' ') || 'Registered'}
      </div>

      {assignedNurse ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', marginTop: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>Clinical Contact</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A', fontWeight: 900, fontSize: '18px' }}>
              {assignedNurse?.name?.[0] || 'N'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>Nurse {assignedNurse.name}</div>
              <div style={{ fontSize: '13px', opacity: 0.7, fontWeight: 500 }}>{assignedNurse.ward} &middot; Ext: {assignedNurse.contact}</div>
            </div>
          </div>
        </div>
      ) : currentStatus !== 'discharged' && currentStatus !== 'registered' ? (
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#DBEAFE', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
          <Activity size={16} style={{ animation: 'pulse 2s infinite' }} /> Waiting for auto-assignment...
        </div>
      ) : null}
    </div>
  );
};

export default StatusCard;
