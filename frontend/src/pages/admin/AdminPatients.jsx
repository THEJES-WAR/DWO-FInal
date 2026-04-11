import React, { useCallback, useEffect, useState } from 'react';
import { Users, Phone, Mail, Droplets, RefreshCw, Search } from 'lucide-react';
import { API_ORIGIN } from '../../utils/api';

const API_URL = API_ORIGIN;

const AdminPatients = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'x-user': JSON.stringify(user) },
      });

      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter((patient) => {
    const query = search.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px', color: '#64748B' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 700 }}>Loading patients...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>Patient Directory</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
            Registered patients and their contact details
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              style={{ padding: '10px 14px 10px 34px', borderRadius: '18px', border: '1px solid #E2E8F0', width: '240px', fontSize: '13px' }}
            />
          </div>
          <button
            onClick={fetchPatients}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
        <div style={{ background: '#EFF6FF', borderRadius: '18px', padding: '20px 24px' }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#2563EB' }}>{patients.length}</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>Total Patients</div>
        </div>
        <div style={{ background: '#F0FDF4', borderRadius: '18px', padding: '20px 24px' }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#16A34A' }}>
            {patients.filter((patient) => patient.bloodGroup).length}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Profiles With Blood Group</div>
        </div>
        <div style={{ background: '#FFF7ED', borderRadius: '18px', padding: '20px 24px' }}>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#EA580C' }}>
            {patients.filter((patient) => patient.phone).length}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>Profiles With Phone</div>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '56px 24px', textAlign: 'center', color: '#94A3B8' }}>
          <Users size={42} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 700 }}>No patients found for that search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredPatients.map((patient) => (
            <div key={patient._id} style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>
                  {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{patient.name}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>ID: {patient._id?.slice(-6)?.toUpperCase()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#94A3B8" />
                  <span>{patient.email || 'No email'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="#94A3B8" />
                  <span>{patient.phone || 'No phone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets size={14} color="#94A3B8" />
                  <span>{patient.bloodGroup || 'Blood group not set'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminPatients;
