import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogIn, Loader2 } from 'lucide-react';
import PatientSignup from '../components/PatientSignup';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [role, setRole] = useState('Doctor'); // Doctor | Nurse | Patient | Admin
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setError('');
        if (newRole !== 'Patient') {
            setIsSignup(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSuccess = (data) => {
        // Assume correct response structure: { token, role, name }
        localStorage.setItem('user', JSON.stringify(data));
        if (data.role === 'Admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            localStorage.setItem('token', data.token);
            handleLoginSuccess(data);
        } catch (err) {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header">
                    <div className="logo-container">
                        <Activity size={32} />
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>MedPlus+</h1>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Professional Healthcare Management
                    </p>
                </div>

                {!isSignup ? (
                    <div className="card-body">
                        <div className="role-tabs">
                            {['Doctor', 'Nurse', 'Patient', 'Admin'].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleRoleChange(r)}
                                    className={`role-tab ${role === r ? 'active' : ''}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="alert-error">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    className="form-input" 
                                    required 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder={`Enter your ${role.toLowerCase()} email`} 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    className="form-input" 
                                    required 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="••••••••" 
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                                Sign In
                            </button>

                            {role === 'Patient' && (
                                <div className="text-center mt-4 text-sm text-secondary">
                                    Don't have an account?{' '}
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSignup(true)} 
                                        className="toggle-mode"
                                    >
                                        Sign up here
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                ) : (
                    <PatientSignup 
                        onBackToLogin={() => setIsSignup(false)} 
                        onLoginSuccess={handleLoginSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default Login;
