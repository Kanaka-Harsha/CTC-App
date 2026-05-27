import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

function ReportHistory() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem('userEmail');
        
        if (!email) {
          toast.error('User not found. Please log in again.');
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_BASE_URL}/report/history?email=${email}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report history');
        }

        const data = await response.json();
        setReports(data);
      } catch (err) {
        toast.error('Failed to load report history');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="page-container" style={{ textAlign: 'center', marginTop: '40px' }}>Loading reports...</div>;
  }

  return (
    <div className="page-container">
      <div className="glass-card">
        <h1 style={{ marginBottom: '24px' }}>My Report History</h1>
        
        {reports.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>You haven't submitted any reports yet.</p>
        ) : (
          <div className="report-list">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{report.incident_type}</span>
                  <span className={`report-status status-${report.ai_status.toLowerCase()}`}>
                    {report.ai_status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <Calendar size={14} />
                    <span>{formatDate(report.incident_ts)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MapPin size={14} />
                    <span>{report.incident_location}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                    <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: '1.4' }}>{report.description}</span>
                  </div>
                </div>
                
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Report ID: {report.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportHistory;
