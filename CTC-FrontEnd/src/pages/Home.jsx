import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ShieldAlert, LogIn } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAuth') === 'true') {
      navigate('/upload', { replace: true });
    }
  }, [navigate]);
  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
      <img src="/CTC_Main.png" alt="CTC Logo" style={{ width: '120px', marginBottom: 'var(--spacing-md)' }} />
      <h1>Welcome to CTC</h1>
      <p style={{ fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Citizen Traffic Camera</p>
      <p>Report traffic violations and accidents quickly and securely. Your reports help keep our roads safe.</p>
      
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <Link to="/login" className="btn-primary btn-secondary">
          <LogIn size={24} />
          Login to Account
        </Link>
      </div>

      <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-md)', backgroundColor: '#f5f5f5', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', textAlign: 'left' }}>
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
