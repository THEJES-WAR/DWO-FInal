import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { apiUrl } from '../../utils/api';

const TestUploader = ({ patient, onUploadComplete }) => {
    const [testName, setTestName] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotifications();

    const handleUpload = async () => {
        if (!testName || !result) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(apiUrl('/nurse/upload-test-results'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
                body: JSON.stringify({ patientId: patient.id, testName, result })
            });
            if (res.ok) {
                addToast({ type: 'success', message: 'Test results uploaded to doctor.' });
                setTestName('');
                setResult('');
                if (onUploadComplete) onUploadComplete();
            }
        } catch (err) {
            console.error(err);
            addToast({ type: 'urgent', message: 'Failed to upload tests' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#8b5cf6" /> Upload Test Results
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>Test Name/Type</label>
                    <input 
                        type="text" placeholder="e.g. Blood Test, BP"
                        value={testName} onChange={e => setTestName(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>Results / Notes</label>
                    <input 
                        type="text" placeholder="e.g. 120/80 mmHg, Normal"
                        value={result} onChange={e => setResult(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    />
                </div>
            </div>

            <button 
                onClick={handleUpload}
                disabled={loading || !testName || !result}
                style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white',
                    fontSize: '14px', fontWeight: 600, cursor: (loading || !testName || !result) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !testName || !result) ? 0.6 : 1
                }}
            >
                {loading ? 'Uploading...' : <><Upload size={16} /> Submit to Doctor</>}
            </button>
        </div>
    );
};

export default TestUploader;
