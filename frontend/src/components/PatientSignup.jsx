import React, { useState } from 'react';
import { UserPlus, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

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

            // Success
            localStorage.setItem('token', data.token);
            onLoginSuccess(data);
            
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-body">
            <div className="text-center mb-6">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Account</h2>
                <p className="text-secondary">Register as a new patient</p>
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

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" name="password" className="form-input" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="tel" name="phone" className="form-input" required value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" name="dob" className="form-input" required value={formData.dob} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select name="gender" className="form-input" required value={formData.gender} onChange={handleChange}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select name="bloodGroup" className="form-input" required value={formData.bloodGroup} onChange={handleChange}>
                            <option value="">Select Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Address</label>
                    <input type="text" name="address" className="form-input" required value={formData.address} onChange={handleChange} placeholder="123 Main St, City" />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    Create Account
                </button>

                <div className="text-center mt-4 text-sm">
                    Already have an account? <button type="button" onClick={onBackToLogin} className="toggle-mode">Log in here</button>
                </div>
            </form>
        </div>
    );
};

export default PatientSignup;
