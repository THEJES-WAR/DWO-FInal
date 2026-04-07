import React from 'react';
import { ClipboardList, Beaker, FileText, CheckCircle2 } from 'lucide-react';

const FeedbackSection = ({ feedbackList, testResults }) => {
    if (!feedbackList || feedbackList.length === 0) return null;

    const latestFeedback = feedbackList[feedbackList.length - 1];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Doctor's Notes */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                        <ClipboardList size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Doctor's Feedback</h2>
                </div>

                <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#334155', fontWeight: 600, lineHeight: 1.6 }}>
                        "{latestFeedback.notes}"
                    </p>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                        — Dr. {latestFeedback.doctorName} &middot; {new Date(latestFeedback.createdAt).toLocaleString()}
                    </div>
                </div>

                {latestFeedback.testsRequired?.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Beaker size={14} /> Required Tests
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {latestFeedback.testsRequired.map((test, index) => {
                                const isDone = testResults?.some(tr => tr.testName === test);
                                return (
                                    <div key={index} style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '8px', 
                                        background: isDone ? '#F0FDF4' : '#FFFBEB', 
                                        color: isDone ? '#166534' : '#92400E', 
                                        border: isDone ? '1px solid #BBF7D0' : '1px solid #FEF3C7',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {test} {isDone && <CheckCircle2 size={14} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Test Results Display */}
            {testResults?.length > 0 && (
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                            <FileText size={20} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Clinical Test Reports</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {testResults.map((test, idx) => (
                            <div key={idx} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{test.testName}</span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{new Date(test.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#475569', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                                    {test.result}
                                </p>
                                <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                                    Uploaded by: {test.uploadedBy}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackSection;
