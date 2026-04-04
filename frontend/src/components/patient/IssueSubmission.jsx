import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

const IssueSubmission = ({ issue, onSubmit }) => {
  const [issueText, setIssueText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueText.trim()) return;
    setSubmitting(true);
    await onSubmit(issueText);
    setSubmitting(false);
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '8px', background: '#8B5CF615', borderRadius: '10px' }}>
          <MessageSquare size={20} color="#8B5CF6" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Describe your symptoms</h3>
      </div>
      
      <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        Please describe what you're experiencing today. Submitting this will alert the nearest available nurse to assist you immediately.
      </p>

      {issue ? (
        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6', marginBottom: '8px', textTransform: 'uppercase' }}>Submitted Issue</div>
          <p style={{ fontSize: '15px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>"{issue.description}"</p>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '16px', fontWeight: 500 }}>
            Submitted on {new Date(issue.submittedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
          <textarea 
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            placeholder="E.g., I have a severe headache and fever since yesterday..."
            style={{ flex: 1, minHeight: '120px', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '15px', fontFamily: 'inherit', resize: 'none', outline: 'none', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#8B5CF6'}
            onBlur={e => e.target.style.borderColor = '#CBD5E1'}
          />
          <button 
            onClick={handleSubmit}
            disabled={submitting || !issueText.trim()}
            style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: submitting || !issueText.trim() ? 'not-allowed' : 'pointer', opacity: submitting || !issueText.trim() ? 0.6 : 1, transition: 'background 0.2s' }}
          >
            {submitting ? 'Submitting...' : 'Submit Symptoms'}
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueSubmission;
