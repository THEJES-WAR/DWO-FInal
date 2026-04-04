import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertOctagon, TrendingUp, Users, Activity } from 'lucide-react';

const AdminWorkflowAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/workflow/admin/analytics`, {
                headers: { 'x-user': JSON.stringify(user) }
            });
            if (res.ok) {
                setAnalytics(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (loading) setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Workflow Data...</div>;
    if (!analytics) return <div style={{ padding: '2rem' }}>Data Unavailable</div>;

    const pieColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Booked Appointments</p>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>{analytics.overview.bookedAppts}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>Cancellations</p>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>{analytics.overview.cancelledAppts}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#ca8a04', fontSize: '0.875rem', fontWeight: 600 }}>Pending Tasks</p>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>{analytics.overview.pendingTasks}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#059669', fontSize: '0.875rem', fontWeight: 600 }}>Completed Tasks</p>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>{analytics.overview.completedTasks}</h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Visualizations */}
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity color="#3b82f6" /> Pending Task Breakdown
                    </h3>
                    
                    {analytics.taskBreakdown.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.taskBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.taskBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No pending tasks to analyze.</p>
                    )}
                </div>

                {/* Bottlenecks and AI Suggestions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: '#fff1f2', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #fecdd3' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e11d48', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertOctagon size={20} /> Severe Bottlenecks
                        </h3>
                        <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#9f1239' }}>{analytics.bottlenecks}</p>
                        <p style={{ color: '#be123c', fontSize: '0.875rem', margin: 0 }}>tasks delayed over 1 hour.</p>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1 }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} color="#2563eb" /> System Suggestions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {analytics.suggestions.map((suggestion, idx) => (
                                <div key={idx} style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', color: '#064e3b', fontSize: '0.875rem', borderRadius: '0 0.5rem 0.5rem 0' }}>
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWorkflowAnalytics;
