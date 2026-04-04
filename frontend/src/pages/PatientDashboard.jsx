import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Activity, Bell } from 'lucide-react';

import { useNotifications } from '../context/NotificationContext';
import { getTemplate } from '../components/notifications/messageTemplates';
import StatusCard from '../components/patient/StatusCard';
import IssueSubmission from '../components/patient/IssueSubmission';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/patient';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const { addToast, toggleDrawer } = useNotifications();

  useEffect(() => {
    if (!token || user?.role !== 'Patient') {
      navigate('/');
      return;
    }

    fetchDashboardData();

    // Socket.io initialization with new room schema
    const socket = io(SOCKET_URL);
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      socket.emit('join_room', { role: 'Patient', id: user._id });
    });

    // Handle new Event mappings from backend
    socket.on('nurse:assigned', (payload) => {
      console.log('Live update - Nurse Assigned:', payload);
      addToast({
        type: 'success',
        message: getTemplate('nurse_assigned', { patientName: user.name, nurse: payload.nurse })
      });
      fetchDashboardData();
    });

    socket.on('appointment:booked', (payload) => {
      addToast({ type: 'info', message: getTemplate('appointment_booked', payload) });
      fetchDashboardData();
    });

    socket.on('appointment:cancelled', (payload) => {
      addToast({ type: 'urgent', message: getTemplate('appointment_cancelled', payload) });
      fetchDashboardData();
    });

    socket.on('feedback:given', (payload) => {
      addToast({ type: 'info', message: getTemplate('feedback_given', payload) });
      fetchDashboardData();
    });
    socket.on('prescription:ready', () => fetchDashboardData());
    socket.on('bill:generated', () => fetchDashboardData());
    socket.on('patient:discharged', () => fetchDashboardData());

    return () => socket.disconnect();
  }, [token, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { 'x-user': JSON.stringify(user) }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleIssueSubmit = async (issueText) => {
    try {
      const res = await fetch(`${API_URL}/submit-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user': JSON.stringify(user)
        },
        body: JSON.stringify({ description: issueText })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <Activity size={40} color="#2563EB" style={{ animation: 'pulse 2s infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 600, color: '#64748B' }}>Loading your health portal...</p>
      </div>
    </div>
  );

  if (!data) return <div style={{ color: '#EF4444', padding: '20px' }}>Failed to load portal data.</div>;

  const {
    profile, status, issue, assignedNurse,
    notifications
  } = data;

  const hasNotifications = notifications && notifications.length > 0;
  const unreadCount = hasNotifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Navigation */}
      <nav style={{ background: '#FFFFFF', padding: '20px 40px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.5px' }}>
            MedPlus<span style={{ color: '#2563EB' }}>+</span> Patient
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={toggleDrawer}>
            <Bell size={20} color="#64748B" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile.name}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>ID: {profile.id.slice(-6).toUpperCase()}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #DBEAFE, #93C5FD)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', fontWeight: 800 }}>
              {profile.name.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: Phase 2 Components (Status & Issue) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          <StatusCard currentStatus={status} assignedNurse={assignedNurse} />
          <IssueSubmission issue={issue} onSubmit={handleIssueSubmit} />
        </div>

        {/* Placeholder for future phases */}
        <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #CBD5E1', borderRadius: '16px', color: '#94A3B8', fontWeight: 600 }}>
          Additional portal widgets rendering here in upcoming phases...
        </div>

      </main>
    </div>
  );
};

export default PatientDashboard;
