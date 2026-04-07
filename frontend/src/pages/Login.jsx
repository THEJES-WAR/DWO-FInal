import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Mail, Lock, User, ShieldCheck, UserCheck, Settings, Info, Heart, Activity, Shield, Star } from 'lucide-react';
import PatientSignup from '../components/PatientSignup';

const API_URL = 'http://localhost:5000/api';

/* ─── Role Config ─── */
const ROLES = [
    { id: 'Doctor',  label: 'Doctor',  icon: UserCheck,   color: '#6366F1', bg: '#EEF2FF', desc: 'Patient consultations' },
    { id: 'Nurse',   label: 'Nurse',   icon: Activity,    color: '#10B981', bg: '#ECFDF5', desc: 'Vitals & care' },
    { id: 'Patient', label: 'Patient', icon: User,        color: '#3B82F6', bg: '#EFF6FF', desc: 'Your health journey' },
    { id: 'Admin',   label: 'Admin',   icon: Settings,    color: '#F59E0B', bg: '#FFFBEB', desc: 'System management' },
];

const FEATURES = [
    { icon: Heart,    text: 'Integrated patient lifecycle management', color: '#F43F5E' },
    { icon: Shield,   text: 'Enterprise-grade role-based access control', color: '#6366F1' },
    { icon: Activity, text: 'Real-time vitals and clinical monitoring', color: '#10B981' },
    { icon: Star,     text: 'Automated billing and prescription system', color: '#F59E0B' },
];

const Login = () => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [role, setRole] = useState('Doctor');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setError('');
        if (newRole !== 'Patient') setIsSignup(false);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLoginSuccess = (data) => {
        localStorage.setItem('user', JSON.stringify(data));
        navigate(data.role === 'Admin' ? '/admin' : '/dashboard');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role })
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error || 'Login failed');
            localStorage.setItem('token', data.token);
            handleLoginSuccess(data);
        } catch {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    if (isSignup) return <PatientSignup onBackToLogin={() => setIsSignup(false)} onLoginSuccess={handleLoginSuccess} />;

    const activeRole = ROLES.find(r => r.id === role);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── LEFT PANEL ── */}
            <div style={{
                width: '45%', minWidth: '420px', flexShrink: 0,
                background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 40%, #1a1f3a 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '56px 60px', position: 'relative', overflow: 'hidden'
            }}>
                {/* Background decorations */}
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: '40%', right: '5%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

                {/* Top: Logo */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '56px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.4)' }}>
                            <Heart size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1 }}>MedPlus<span style={{ color: '#818CF8' }}>+</span></div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>Health Central</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '48px' }}>
                        <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px 0', lineHeight: 1.15, letterSpacing: '-1px' }}>
                            Your Health<br /><span style={{ background: 'linear-gradient(90deg, #818CF8, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Command Center</span>
                        </h1>
                        <p style={{ fontSize: '16px', color: '#94A3B8', lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                            A unified clinical platform — from vitals to discharge, everything managed in one place.
                        </p>
                    </div>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {FEATURES.map(({ icon: Icon, text, color }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={16} color={color} />
                                </div>
                                <span style={{ fontSize: '14px', color: '#CBD5E1', fontWeight: 500, lineHeight: 1.4 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Version badge */}
                <div style={{ position: 'relative', zIndex: 2, paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase' }}>Secure Enterprise v2.0</span>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ flex: 1, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '440px' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Sign in to your portal</h2>
                        <p style={{ fontSize: '15px', color: '#64748B', margin: 0, fontWeight: 400 }}>Select your role and enter your credentials.</p>
                    </div>

                    {/* Role Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
                        {ROLES.map(({ id, label, icon: Icon, color, bg, desc }) => {
                            const isActive = role === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleRoleChange(id)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                        padding: '14px 8px', borderRadius: '16px', cursor: 'pointer',
                                        border: isActive ? `2px solid ${color}` : '2px solid #E2E8F0',
                                        background: isActive ? bg : '#FFFFFF',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isActive ? `0 4px 14px ${color}33` : 'none',
                                        transform: isActive ? 'translateY(-1px)' : 'none'
                                    }}
                                >
                                    <Icon size={20} color={isActive ? color : '#94A3B8'} />
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: isActive ? color : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active role label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '12px 16px', background: `${activeRole.color}11`, borderRadius: '12px', border: `1px solid ${activeRole.color}22` }}>
                        <activeRole.icon size={16} color={activeRole.color} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: activeRole.color }}>Signing in as {activeRole.label} — {activeRole.desc}</span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '14px 16px', borderRadius: '14px', marginBottom: '20px' }}>
                            <Info size={18} color="#EF4444" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email" name="email" required
                                    value={formData.email} onChange={handleChange}
                                    placeholder="your@email.com"
                                    style={{
                                        width: '100%', padding: '14px 16px 14px 46px', borderRadius: '14px',
                                        border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: 500,
                                        color: '#1E293B', background: '#FFFFFF', outline: 'none',
                                        transition: 'border-color 0.2s', boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = activeRole.color}
                                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password" name="password" required
                                    value={formData.password} onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '14px 16px 14px 46px', borderRadius: '14px',
                                        border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: 500,
                                        color: '#1E293B', background: '#FFFFFF', outline: 'none',
                                        transition: 'border-color 0.2s', boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = activeRole.color}
                                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                                background: loading ? '#CBD5E1' : `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}CC)`,
                                color: 'white', fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                transition: 'all 0.2s ease', marginTop: '4px',
                                boxShadow: loading ? 'none' : `0 8px 20px ${activeRole.color}44`,
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {loading
                                ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating…</>
                                : <><LogIn size={20} /> Sign In as {activeRole.label}</>
                            }
                        </button>

                        {role === 'Patient' && (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748B', margin: 0, fontWeight: 500 }}>
                                New patient?{' '}
                                <button type="button" onClick={() => setIsSignup(true)}
                                    style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px' }}>
                                    Create an account
                                </button>
                            </p>
                        )}
                    </form>

                    {/* Footer */}
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#CBD5E1', marginTop: '36px', fontWeight: 500 }}>
                        Protected by MedPlus+ Security Framework · HIPAA Compliant
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input::placeholder { color: #CBD5E1 !important; }
                @media (max-width: 768px) {
                    .login-left { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;
