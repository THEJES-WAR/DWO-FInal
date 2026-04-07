import React, { useState } from 'react';
import { 
    UserPlus, ArrowRight, Loader2, User, Mail, Lock, Phone, 
    Calendar, Droplets, MapPin, ChevronRight, Info 
} from 'lucide-react';

const API_URL = 'https://dwo-final.onrender.com/api';
// Using the generated medical illustration
const SIDEBAR_IMAGE = '/medical_signup_illustration_1775464346455.png'; 

const PatientSignup = ({ onBackToLogin, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        address: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to sign up');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // Ensure user is stored
            onLoginSuccess(data);
            
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px 12px 44px',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        fontSize: '14px',
        fontWeight: 500,
        color: '#1E293B',
        outline: 'none',
        transition: 'all 0.2s ease',
        background: '#F8FAFC'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 800,
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: '8px',
        letterSpacing: '0.5px'
    };

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            background: '#F1F5F9',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Left Column: Branding & Illustration */}
            <div style={{ 
                flex: '0 0 450px', 
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                padding: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                color: 'white'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 900 }}>M</div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>MedPlus+</h1>
                    </div>
                    <h2 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>Begin Your <span style={{ opacity: 0.7 }}>Healthcare</span> Journey</h2>
                    <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.6, fontWeight: 500 }}>Join thousands of patients receiving world-class digital health optimization.</p>
                </div>

                <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '400px', opacity: 0.4 }}>
                    <img src={SIDEBAR_IMAGE} alt="Healthcare Illustration" style={{ width: '100%', transform: 'rotate(-5deg)' }} />
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        {[1,2,3].map(i => <div key={i} style={{ width: '40px', height: '6px', background: i === 1 ? 'white' : 'rgba(255,255,255,0.3)', borderRadius: '10px' }} />)}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>Trusted by over 100+ Hospitals nationwide.</p>
                </div>
            </div>

            {/* Right Column: Signup Form */}
            <div style={{ flex: 1, padding: '40px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                <div style={{ maxWidth: '650px', width: '100%' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Create Your Profile</h3>
                        <p style={{ color: '#64748B', fontSize: '16px', fontWeight: 500 }}>Already part of the network? <button onClick={onBackToLogin} style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Log In Here</button></p>
                    </div>

                    {error && (
                        <div style={{ background: '#FEF2F2', padding: '16px 20px', borderRadius: '16px', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '12px', color: '#991B1B', marginBottom: '32px', fontSize: '14px', fontWeight: 600 }}>
                            <Info size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Section 1: Basic Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Full Name</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><User size={18} /></div>
                                <input type="text" name="name" style={inputStyle} required value={formData.name} onChange={handleChange} placeholder="John Doe" />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Blood Group</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><Droplets size={18} /></div>
                                <select name="bloodGroup" style={inputStyle} required value={formData.bloodGroup} onChange={handleChange}>
                                    <option value="">Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Section 2: Account Security */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Email Address</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><Mail size={18} /></div>
                                <input type="email" name="email" style={inputStyle} required value={formData.email} onChange={handleChange} placeholder="john@medplus.com" />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><Lock size={18} /></div>
                                <input type="password" name="password" style={inputStyle} required value={formData.password} onChange={handleChange} placeholder="••••••••" />
                            </div>
                        </div>

                        {/* Section 3: Personal Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Phone</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><Phone size={18} /></div>
                                <input type="tel" name="phone" style={inputStyle} required value={formData.phone} onChange={handleChange} placeholder="+1 234..." />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Date of Birth</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><Calendar size={18} /></div>
                                <input type="date" name="dob" style={inputStyle} required value={formData.dob} onChange={handleChange} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Gender</label>
                                <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><User size={18} /></div>
                                <select name="gender" style={inputStyle} required value={formData.gender} onChange={handleChange}>
                                    <option value="">Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Section 4: Location */}
                        <div style={{ position: 'relative' }}>
                            <label style={labelStyle}>Full Address</label>
                            <div style={{ position: 'absolute', top: '35px', left: '16px', color: '#94A3B8' }}><MapPin size={18} /></div>
                            <input type="text" name="address" style={inputStyle} required value={formData.address} onChange={handleChange} placeholder="123 Digital Ave, Cloud City" />
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    width: '100%', 
                                    padding: '18px', 
                                    background: '#1E293B', 
                                    color: 'white', 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    fontSize: '18px', 
                                    fontWeight: 800, 
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <><UserPlus size={22} /> Get Started Free</>}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
                                By signing up, you agree to our <span style={{ color: '#6366F1' }}>Terms of Service</span> and <span style={{ color: '#6366F1' }}>Privacy Policy</span>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientSignup;
