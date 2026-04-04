import React from 'react';
import { Activity } from 'lucide-react';

const StatusCard = ({ currentStatus, assignedNurse }) => {
  return (
    <div style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px 0' }}>Current Status</h3>
      <div style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px 0', textTransform: 'capitalize' }}>
        {currentStatus.replace(/_/g, ' ')}
      </div>

      {assignedNurse ? (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginTop: 'auto' }}>
          <div style={{ fontSize: '12px', color: '#DBEAFE', fontWeight: 600, marginBottom: '4px' }}>Assigned Nurse</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800 }}>
              {assignedNurse.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{assignedNurse.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Ward: {assignedNurse.ward} &middot; Contact: {assignedNurse.contact}</div>
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
