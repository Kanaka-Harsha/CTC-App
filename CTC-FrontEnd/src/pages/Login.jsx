import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [phoneNo, setPhoneNo] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:8000/user/login?phone_no=${phoneNo}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:8000/user/login_check?phone_no=${phoneNo}&otp=${otp}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid OTP');
      }

      // Success! In the future, save JWT token here.
      alert('Login successful!');
      navigate('/upload');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <p>{step === 1 ? 'Sign in to view your reports or submit new evidence.' : 'Enter the code sent to your phone.'}</p>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label htmlFor="phone_no">Enter Phone Number</label>
            <input 
              type="text" 
              id="phone_no" 
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="e.g. 9876543210" 
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <div className="input-group">
            <label htmlFor="otp">Enter OTP</label>
            <input 
              type="text" 
              id="otp" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code" 
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '16px', padding: '16px', borderRadius: '8px' }}
            onClick={() => setStep(1)}
          >
            Wrong number? Go back.
          </button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)' }}>
        <p>Don't have an account?</p>
        <Link to="/register" className="btn-primary btn-secondary">
          Register Here
        </Link>
      </div>
    </div>
  );
}

export default Login;
