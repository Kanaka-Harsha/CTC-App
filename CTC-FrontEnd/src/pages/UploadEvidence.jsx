import React from 'react';
import { UploadCloud, MapPin } from 'lucide-react';

function UploadEvidence() {
  return (
    <div>
      <h1>Submit Official Report</h1>
      <p>Please fill out the details accurately. This information may be reviewed by authorities.</p>

      <div className="card" style={{ textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer' }}>
        <UploadCloud size={48} color="var(--primary-color)" style={{ margin: '0 auto var(--spacing-sm)' }} />
        <h3 style={{ marginBottom: '8px' }}>Tap to Upload Evidence</h3>
        <p style={{ fontSize: '14px', marginBottom: 0 }}>Select Video (Dashcam/CCTV) or Images</p>
      </div>

      <h2>Incident Details</h2>
      
      <div className="input-group">
        <label htmlFor="datetime">Date & Time</label>
        <input type="datetime-local" id="datetime" />
      </div>

      <div className="input-group">
        <label htmlFor="location">Location</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" id="location" placeholder="Street Name / Area" style={{ flex: 1 }} />
          <button className="btn-secondary" style={{ padding: '0 16px', borderRadius: 'var(--border-radius)', cursor: 'pointer' }}>
            <MapPin size={24} />
          </button>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="type">Incident Type</label>
        <select id="type">
          <option value="">-- Select Type --</option>
          <option value="accident">Accident / Collision</option>
          <option value="redlight">Red Light Violation</option>
          <option value="wrongway">Wrong Way Driving</option>
          <option value="speeding">Overspeeding</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="description">Description (Optional)</label>
        <textarea id="description" placeholder="Provide any additional context here..."></textarea>
      </div>

      <h2>Involved Parties</h2>
      
      <div className="input-group">
        <label htmlFor="vehicle_number">Vehicle Registration Number(s)</label>
        <input type="text" id="vehicle_number" placeholder="e.g. MH 01 AB 1234" />
      </div>

      <div className="input-group">
        <label htmlFor="witnesses">Witness Details (Optional)</label>
        <input type="text" id="witnesses" placeholder="Name and Contact of witnesses" />
      </div>

      <button className="btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
        Submit Official Report
      </button>
    </div>
  );
}

export default UploadEvidence;
