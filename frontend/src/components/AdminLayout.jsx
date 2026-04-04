import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, GitBranch, Users,
  Calendar, Bell, FileText, LogOut, Activity, ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user.role !== 'Admin') {
    navigate('/');
    return null;
  }

  const menuItems = [
    { label: 'Overview',     icon: LayoutDashboard, path: '/admin-v2/overview' },
    { label: 'Bottlenecks',  icon: AlertTriangle,   path: '/admin-v2/bottlenecks' },
    { label: 'Workflow',     icon: GitBranch,        path: '/admin-v2/workflow' },
    { label: 'Staff',        icon: Users,            path: '/admin-v2/staff' },
    { label: 'Appointments', icon: Calendar,         path: '/admin-v2/appointments' },
    { label: 'Alerts',       icon: Bell,             path: '/admin-v2/alerts' },
    { label: 'Reports',      icon: FileText,         path: '/admin-v2/reports' },
  ];

  const activePage = location.pathname.split('/').pop().replace('-', ' ');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#F1F5F9', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '256px', minWidth: '256px',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        zIndex: 20,
      }}>

        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.3px', lineHeight: 1 }}>
                MedPlus<span style={{ color: '#2563EB' }}>+</span>
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
                Admin Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>
            Main Menu
          </p>
          {menuItems.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname.includes(path);
            return (
              <button key={label} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 12px',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                marginBottom: '2px',
                background: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#1D4ED8' : '#475569',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
              >
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#2563EB' : '#94A3B8' }} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={14} style={{ color: '#93C5FD' }} />}
              </button>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '14px', color: '#1D4ED8',
              flexShrink: 0, border: '1px solid #BFDBFE',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>System Administrator</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '8px 12px',
            borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#EF4444',
            fontSize: '13px', fontWeight: 600,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: '58px', padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', zIndex: 10, flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', textTransform: 'capitalize', margin: 0 }}>
              {activePage || 'Dashboard'}
            </h1>
            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>
              MedPlus+ Admin Console
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#F0FDF4', padding: '5px 12px',
              borderRadius: '20px', border: '1px solid #BBF7D0',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)', animation: 'pulse 2s infinite' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', letterSpacing: '0.04em' }}>LIVE</span>
            </div>
            <button style={{
              position: 'relative', width: '34px', height: '34px',
              borderRadius: '8px', border: '1px solid #E2E8F0',
              background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B',
            }}>
              <Bell size={16} />
              <span style={{
                position: 'absolute', top: '7px', right: '7px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#EF4444', border: '1.5px solid white',
              }}></span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
