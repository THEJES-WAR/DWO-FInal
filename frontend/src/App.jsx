import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import ToastManager from './components/notifications/ToastManager';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import Login from './pages/Login';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import NurseDashboard from './pages/NurseDashboard';
import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminWorkflow from './pages/admin/AdminWorkflow';
import AdminBottlenecks from './pages/admin/AdminBottlenecks';

// Stubs for unbuilt pages
const Stub = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <h2 className="text-2xl text-slate-500 font-bold">{title} Page (Under Construction)</h2>
  </div>
);

const RoleBasedDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'Admin':
      return <Navigate to="/admin-v2/overview" />;
    case 'Doctor':
      return <DoctorDashboard />;
    case 'Nurse':
      return <NurseDashboard />;
    case 'Patient':
      return <PatientDashboard />;
    default:
      return <Navigate to="/" />;
  }
};

const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <ToastManager />
        <NotificationDrawer />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<RoleBasedDashboard />} />
          
          {/* Legacy Admin Dashboard Route */}
          <Route path="/admin" element={<Navigate to="/admin-v2/overview" />} />

          {/* New V2 Premium Admin Routes */}
          <Route path="/admin-v2" element={<AdminLayout />}>
             <Route path="overview" element={<AdminOverview />} />
             <Route path="bottlenecks" element={<AdminBottlenecks />} />
             <Route path="workflow" element={<AdminWorkflow />} />
             <Route path="staff" element={<Stub title="Staff" />} />
             <Route path="appointments" element={<Stub title="Appointments" />} />
             <Route path="alerts" element={<Stub title="Alerts" />} />
             <Route path="reports" element={<Stub title="Reports" />} />
             <Route index element={<Navigate to="overview" />} />
          </Route>
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
