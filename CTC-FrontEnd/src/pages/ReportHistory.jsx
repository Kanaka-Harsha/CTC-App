import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, FileText, Activity, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ReportHistory() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log("[DEV] Fetching report history for user...");
        setLoading(true);
        const email = localStorage.getItem('userEmail');
        
        if (!email) {
          console.warn("[DEV] No email found in localStorage.");
          toast.error('User not found. Please log in again.');
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_BASE_URL}/report/history?email=${email}`);
        
        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          console.error("[DEV] Failed to fetch reports. Server responded with:", err);
          throw new Error('Failed to fetch report history');
        }

        const data = await response.json();
        console.log("[DEV] Successfully fetched reports:", data.length);
        setReports(data);
      } catch (err) {
        console.error("[DEV] Caught error fetching reports:", err);
        toast.error("We're having trouble loading your past reports right now. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    
    console.log(`[DEV] Attempting to delete report with ID: ${reportId}`);
    toast.loading("Removing your report...", { id: "deleteToast" });
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const cleanId = reportId.toString().replace('REP-', '');
      
      console.log(`[DEV] Sending delete request for raw ID: ${cleanId}`);
      // Passing rid as query parameter since backend route is `@app.get("/report/history/delete")`
      const response = await fetch(`${API_BASE_URL}/report/history/delete?rid=${cleanId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const err = await response.json().catch(()=>({}));
        console.error("[DEV] Delete failed. Server responded with:", err);
        throw new Error("Delete failed");
      }
      
      console.log("[DEV] Report successfully deleted from backend.");
      toast.success("Report removed successfully.", { id: "deleteToast" });
      
      // Update UI state to remove the report immediately
      setReports(reports.filter((r) => r.id !== reportId));
      
    } catch (error) {
      console.error("[DEV] Caught error in handleDelete:", error);
      toast.error("We couldn't remove your report at this time. Please try again later.", { id: "deleteToast" });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="page-container fade-in" style={{ textAlign: 'center', marginTop: '40px' }}><span className="spinner spinner-primary"></span> Loading reports...</div>;
  }

  return (
    <div className="page-container fade-in">
      <div className="glass-card">
        <h1 style={{ marginBottom: '24px' }}>My Report History</h1>
        
        {reports.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>You haven't submitted any reports yet.</p>
        ) : (
          <div className="report-list">
            {reports.map((report) => {
              let parsedAiReport = null;
              if (report.ai_status === 'COMPLETED' && report.ai_report && report.ai_report !== 'PENDING') {
                try {
                  parsedAiReport = JSON.parse(report.ai_report);
                } catch(e) {
                  console.error("Failed to parse AI report JSON", e);
                }
              }

              return (
              <div key={report.id} className="report-card">
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '600', fontSize: '18px' }}>{report.incident_type}</span>
                    <span className={`report-status status-${report.ai_status.toLowerCase()}`}>
                      {report.ai_status}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="btn-secondary"
                    style={{ padding: '6px', backgroundColor: 'transparent', color: '#ff4d4f', border: 'none', boxShadow: 'none', cursor: 'pointer' }}
                    title="Delete Report"
                  >
                    <Trash2 size={18} />
                  </button>
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
                
                {parsedAiReport && (
                  <div className="ai-report-section" style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(0, 86, 179, 0.05)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(0, 86, 179, 0.2)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary-color)', fontSize: '15px' }}>
                      <Activity size={16} /> AI Analysis Report
                    </h4>
                    <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <p style={{ margin: 0 }}><strong>Detected:</strong> {parsedAiReport.incident_detected}</p>
                      <p style={{ margin: 0 }}><strong>Summary:</strong> {parsedAiReport.general_summary}</p>
                      
                      {parsedAiReport.accident_details?.occurred && (
                        <p style={{ margin: 0 }}><strong>Accident Details:</strong> Vehicles: {parsedAiReport.accident_details.vehicles?.join(', ') || 'None'}. Plates: {parsedAiReport.accident_details.number_plates?.join(', ') || 'None'}</p>
                      )}
                      {parsedAiReport.theft_details?.occurred && (
                        <p style={{ margin: 0 }}><strong>Theft Details:</strong> {parsedAiReport.theft_details.how_it_happened}</p>
                      )}
                      {parsedAiReport.harassment_details?.occurred && (
                        <p style={{ margin: 0 }}><strong>Harassment Details:</strong> {parsedAiReport.harassment_details.to_whom}</p>
                      )}
                      {parsedAiReport.kidnapping_details?.occurred && (
                        <p style={{ margin: 0 }}><strong>Kidnapping Details:</strong> {parsedAiReport.kidnapping_details.who_and_how}</p>
                      )}
                      {parsedAiReport.suspicious_activities?.occurred && (
                        <p style={{ margin: 0 }}><strong>Suspicious Activities:</strong> {parsedAiReport.suspicious_activities.what_happened}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Report ID: {report.id}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportHistory;
