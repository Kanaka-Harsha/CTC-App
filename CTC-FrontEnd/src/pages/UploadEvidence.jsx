import React, { useRef, useState } from 'react';
import { UploadCloud, MapPin, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadEvidence() {
  const fileInputRef = useRef(null);
  
  // State for all form fields
  const [file, setFile] = useState(null);
  const [datetime, setDatetime] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleBoxClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGetLocation = (e) => {
    e.preventDefault();
    if (navigator.geolocation) {
      toast.loading("Fetching location...", { id: "locToast" });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            // Convert GPS coordinates into a text address using OpenStreetMap Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            if (data && data.display_name) {
              setLocationStr(data.display_name); // This sets the actual text address!
              toast.success("Location found!", { id: "locToast" });
            } else {
              setLocationStr(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
              toast.success("Coordinates found (Address unavailable)", { id: "locToast" });
            }
          } catch (err) {
            setLocationStr(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
            toast.success("Coordinates found", { id: "locToast" });
          }
        },
        (error) => {
          let errorMessage = error.message;
          if (error.code === error.PERMISSION_DENIED) errorMessage = "Permission denied. Please allow location access in your browser settings.";
          else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Location unavailable (check your network).";
          else if (error.code === error.TIMEOUT) errorMessage = "Request timed out.";
          
          toast.error(`Error: ${errorMessage}`, { id: "locToast" });
          console.error(error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !datetime || !locationStr || !incidentType) {
      toast.error("Please fill in all required fields and select a file.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Ask Backend for a Pre-signed S3 URL
      toast.loading("Requesting secure upload link...", { id: "submitToast" });
      
      const urlResponse = await fetch(`http://127.0.0.1:8000/report/presigned-url?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`, {
        method: 'GET',
      });

      if (!urlResponse.ok) {
        const err = await urlResponse.json();
        throw new Error(err.detail || 'Failed to get secure upload link');
      }

      const urlData = await urlResponse.json();
      const presignedUrl = urlData.presigned_url;
      const s3VideoLink = urlData.video_link;

      if (!presignedUrl || !s3VideoLink) {
        throw new Error('Backend did not return valid S3 credentials');
      }

      // Step 2: Upload directly to AWS S3 (bypassing backend)
      toast.loading("Uploading video directly to AWS S3...", { id: "submitToast" });
      
      const s3UploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!s3UploadResponse.ok) {
        throw new Error('Failed to upload video to AWS S3');
      }

      // Step 3: Submit the database record with the final S3 link
      toast.loading("Saving report to database...", { id: "submitToast" });
      const userEmail = localStorage.getItem('userEmail') || '';
      
      const submissionData = {
        user_email: userEmail,
        incident_ts: datetime,
        incident_location: locationStr,
        incident_type: incidentType,
        description: description,
        video_link: s3VideoLink
      };

      const queryParams = new URLSearchParams(submissionData).toString();

      const response = await fetch(`http://127.0.0.1:8000/report/submit?${queryParams}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Database submission failed');
      }

      toast.success('Official Report Submitted Successfully!', { id: "submitToast", duration: 4000 });
      
      // Reset form
      setFile(null);
      setDatetime('');
      setLocationStr('');
      setIncidentType('');
      setDescription('');
      
    } catch (error) {
      toast.error(error.message, { id: "submitToast", duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Submit Official Report</h1>
      <p>Please fill out the details accurately. This information may be reviewed by authorities.</p>

      <form onSubmit={handleSubmit}>
        <div 
          className="card" 
          style={{ textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer', padding: 'var(--spacing-xl) var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}
          onClick={handleBoxClick}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="video/*,image/*" 
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <CheckCircle size={48} color="green" style={{ margin: '0 auto var(--spacing-sm)' }} />
              <h3 style={{ marginBottom: '8px', color: 'green' }}>File Selected</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>{file.name}</p>
            </>
          ) : (
            <>
              <UploadCloud size={48} color="var(--primary-color)" style={{ margin: '0 auto var(--spacing-sm)' }} />
              <h3 style={{ marginBottom: '8px' }}>Tap to Upload Evidence</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>Select Video (Dashcam/CCTV) or Images</p>
            </>
          )}
        </div>

        <h2>Incident Details</h2>
        
        <div className="input-group">
          <label htmlFor="datetime">Date & Time *</label>
          <input 
            type="datetime-local" 
            id="datetime" 
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required 
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Location *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              id="location" 
              placeholder="Street Name / GPS Coordinates" 
              style={{ flex: 1 }} 
              value={locationStr}
              onChange={(e) => setLocationStr(e.target.value)}
              required
            />
            <button 
              type="button"
              className="btn-secondary" 
              style={{ padding: '0 16px', borderRadius: 'var(--border-radius)', cursor: 'pointer', width: 'auto', flexShrink: 0 }}
              onClick={handleGetLocation}
              title="Get Current GPS Location"
            >
              <MapPin size={24} />
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="type">Incident Type *</label>
          <select 
            id="type"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            required
          >
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
          <textarea 
            id="description" 
            placeholder="Provide any additional context here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: 'var(--spacing-lg)' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Official Report'}
        </button>
      </form>
    </div>
  );
}

export default UploadEvidence;
