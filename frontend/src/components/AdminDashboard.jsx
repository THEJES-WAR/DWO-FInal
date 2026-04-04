import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Users, Stethoscope, Heart, Shield, LogOut, Search, Activity } from 'lucide-react';
import '../styles/AdminDashboard.css';
import AdminWorkflowAnalytics from './AdminWorkflowAnalytics';

const API_URL = 'http://localhost:5000/api/admin';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const [users, setUsers] = useState({ doctors: [], nurses: [], patients: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: 'Other',
        bloodGroup: 'O+',
        address: '',
    });

    // Fetch all users
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    'x-user': JSON.stringify(user),
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || user?.role !== 'Admin') {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [token, user, navigate]);

    const handleAddClick = () => {
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            dob: '',
            gender: 'Other',
            bloodGroup: 'O+',
            address: '',
        });
        setShowModal(true);
    };

    const handleEditClick = (userItem) => {
        setEditingId(userItem._id);
        setFormData({
            name: userItem.name,
            email: userItem.email,
            password: '',
            phone: userItem.phone || '',
            dob: userItem.dob || '',
            gender: userItem.gender || 'Other',
            bloodGroup: userItem.bloodGroup || 'O+',
            address: userItem.address || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetch(`${API_URL}/users/${id}?role=${activeTab === 'doctors' ? 'Doctor' : activeTab === 'nurses' ? 'Nurse' : 'Patient'}`, {
                    method: 'DELETE',
                    headers: {
                        'x-user': JSON.stringify(user),
                    },
                });
                if (response.ok) {
                    fetchUsers();
                }
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const role = activeTab === 'doctors' ? 'Doctor' : activeTab === 'nurses' ? 'Nurse' : 'Patient';
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password || undefined,
                role,
            };

            if (role === 'Patient') {
                payload.phone = formData.phone;
                payload.dob = formData.dob;
                payload.gender = formData.gender;
                payload.bloodGroup = formData.bloodGroup;
                payload.address = formData.address;
            }

            let response;
            if (editingId) {
                response = await fetch(`${API_URL}/users/${editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user': JSON.stringify(user),
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                if (!formData.password) {
                    alert('Password is required for new users');
                    return;
                }
                response = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user': JSON.stringify(user),
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (response.ok) {
                setShowModal(false);
                fetchUsers();
            } else {
                const error = await response.json();
                alert(error.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Operation failed');
        }
    };

    const getRoleLabel = () => {
        if (activeTab === 'analytics') return 'Analytics';
        if (activeTab === 'doctors') return 'Doctor';
        if (activeTab === 'nurses') return 'Nurse';
        return 'Patient';
    };

    const getRoleIcon = () => {
        if (activeTab === 'analytics') return <Activity size={20} />;
        if (activeTab === 'doctors') return <Stethoscope size={20} />;
        if (activeTab === 'nurses') return <Heart size={20} />;
        return <Users size={20} />;
    };

    const getRoleFields = () => {
        if (activeTab === 'patients') {
            return (
                <>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Gender</label>
                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Blood Group</label>
                            <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                                <option>O+</option>
                                <option>O-</option>
                                <option>A+</option>
                                <option>A-</option>
                                <option>B+</option>
                                <option>B-</option>
                                <option>AB+</option>
                                <option>AB-</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Main Street, City, State"
                        />
                    </div>
                </>
            );
        }
        return null;
    };

    const filteredUsers = (users[activeTab] || []).filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statCards = [
        { label: 'Doctors', count: users.doctors.length, icon: <Stethoscope size={24} />, color: '#3b82f6' },
        { label: 'Nurses', count: users.nurses.length, icon: <Heart size={24} />, color: '#ef4444' },
        { label: 'Patients', count: users.patients.length, icon: <Users size={24} />, color: '#10b981' },
    ];

    if (loading) return <div className="admin-loading">Loading...</div>;
    if (!user || user.role !== 'Admin') return <div className="admin-loading">Unauthorized</div>;

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-header-left">
                        <div className="admin-title-box">
                            <Shield size={32} />
                            <div>
                                <h1>Admin Dashboard</h1>
                                <p>Manage doctors, nurses, and patients</p>
                            </div>
                        </div>
                    </div>
                    <button
                        className="btn-logout"
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            navigate('/');
                        }}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <div className="admin-main">
                {/* Stats Cards */}
                <div className="stats-grid">
                    {statCards.map((card) => (
                        <div key={card.label} className="stat-card" style={{ borderLeftColor: card.color }}>
                            <div className="stat-content">
                                <div>
                                    <p className="stat-label">Total {card.label}</p>
                                    <p className="stat-count">{card.count}</p>
                                </div>
                                <div className="stat-icon" style={{ color: card.color }}>
                                    {card.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="content-card">
                    {/* Tabs and Search */}
                    <div className="tabs-section">
                        <div className="tabs-container">
                            {['analytics', 'doctors', 'nurses', 'patients'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                                >
                                    <span className="tab-icon">{getRoleIcon()}</span>
                                    <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                    {tab !== 'analytics' && <span className="tab-count">({users[tab].length})</span>}
                                </button>
                            ))}
                        </div>
                        <div className="tabs-actions">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="btn-add" onClick={handleAddClick}>
                                <Plus size={18} />
                                <span>Add {getRoleLabel()}</span>
                            </button>
                        </div>
                    </div>

                    {/* Table or Analytics */}
                    {activeTab === 'analytics' ? (
                        <AdminWorkflowAnalytics />
                    ) : filteredUsers.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        {activeTab === 'doctors' && <th>Specialization</th>}
                                        {activeTab === 'nurses' && <th>Type</th>}
                                        {activeTab === 'patients' && (
                                            <>
                                                <th>Phone</th>
                                                <th>Blood Group</th>
                                            </>
                                        )}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((userItem, idx) => (
                                        <tr key={userItem._id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                            <td className="col-name">{userItem.name}</td>
                                            <td className="col-email">{userItem.email}</td>
                                            {activeTab === 'doctors' && <td><span className="badge badge-blue">{userItem.specialization}</span></td>}
                                            {activeTab === 'nurses' && <td><span className="badge badge-red">{userItem.type}</span></td>}
                                            {activeTab === 'patients' && (
                                                <>
                                                    <td>{userItem.phone}</td>
                                                    <td><span className="badge badge-green">{userItem.bloodGroup}</span></td>
                                                </>
                                            )}
                                            <td className="col-actions">
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => handleEditClick(userItem)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-action btn-delete"
                                                    onClick={() => handleDelete(userItem._id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <p className="empty-title">No {activeTab} found</p>
                            <p className="empty-text">Start by adding a new {getRoleLabel().toLowerCase()} to the system</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? `Edit ${getRoleLabel()}` : `Add ${getRoleLabel()}`}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@gmail.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>{editingId ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            {getRoleFields()}

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleSubmit}>
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
