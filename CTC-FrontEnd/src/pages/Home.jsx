import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ShieldAlert, LogIn } from 'lucide-react';

function Home() {
  return (
    <div>
      <h1>Welcome to CTC</h1>
      <p>Report traffic violations and accidents quickly and securely. Your reports help keep our roads safe.</p>
      
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <Link to="/upload" className="btn-primary" style={{ marginBottom: 'var(--spacing-md)' }}>
          <Camera size={24} />
          Report an Incident
        </Link>
        
        <Link to="/login" className="btn-primary btn-secondary">
          <LogIn size={24} />
          Login to Account
        </Link>
      </div>

      <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-md)', backgroundColor: '#ebf8ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={24} color="var(--primary-color)" />
          How it works
        </h2>
        <ol style={{ paddingLeft: '24px', marginTop: 'var(--spacing-sm)' }}>
          <li style={{ marginBottom: '8px' }}>Upload your dashcam or CCTV footage.</li>
          <li style={{ marginBottom: '8px' }}>AI analyzes the evidence.</li>
          <li>Authorities review and take official action.</li>
        </ol>
      </div>
    </div>
  );
}

export default Home;
