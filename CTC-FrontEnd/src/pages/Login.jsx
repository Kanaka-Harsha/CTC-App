import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    console.log(`[Login] Step 1: Initiating OTP request for email: ${email}`);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:8000/user/login?email=${email}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Login] Error sending OTP:', errorData.detail);
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      console.log('[Login] OTP sent successfully! Moving to Step 2 (Verification).');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    console.log(`[Login] Step 2: Verifying OTP for email: ${email}`);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:8000/user/login_check?email=${email}&otp=${otp}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Login] OTP Verification failed:', errorData.detail);
        throw new Error(errorData.detail || 'Invalid OTP');
      }

      console.log('[Login] Verification successful! Redirecting to /upload...');
      // Success!
      localStorage.setItem('isAuth', 'true');
      window.dispatchEvent(new Event('authChange'));
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
      <p>{step === 1 ? 'Sign in to view your reports or submit new evidence.' : 'Enter the code sent to your email.'}</p>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label htmlFor="email">Enter Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com" 
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
            Wrong email? Go back.
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
