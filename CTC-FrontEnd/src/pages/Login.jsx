import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (localStorage.getItem('isAuth') === 'true') {
      navigate('/upload', { replace: true });
    }
  }, [navigate]);
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    toast.loading("Resending OTP...", { id: "resendToast" });
    try {
      const response = await fetch(`${API_BASE_URL}/user/login?email=${email}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend OTP');
      }
      toast.success("OTP resent successfully!", { id: "resendToast" });
      setResendTimer(30); // Restart countdown
    } catch (err) {
      toast.error(err.message, { id: "resendToast" });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    console.log(`[Login] Step 1: Initiating OTP request for email: ${email}`);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/login?email=${email}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Login] Error sending OTP:', errorData.detail);
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      console.log('[Login] OTP sent successfully! Moving to Step 2 (Verification).');
      setStep(2); // Move to OTP verification step
      setResendTimer(30); // Start 30s countdown
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("OTP must be exactly 6 digits");
      return;
    }
    console.log(`[Login] Step 2: Verifying OTP for email: ${email}`);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/login_check?email=${email}&otp=${otp}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Login] OTP Verification failed:', errorData.detail);
        throw new Error(errorData.detail || 'Invalid OTP');
      }

      console.log('[Login] Verification successful! Fetching user name...');
      
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/report/profile?email=${email}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          localStorage.setItem('userName', profileData.name);
        }
      } catch (e) {
        console.error('Failed to fetch profile during login', e);
      }

      // Success!
      localStorage.setItem('isAuth', 'true');
      localStorage.setItem('userEmail', email); // Save email for the report submission
      window.dispatchEvent(new Event('authChange'));
      toast.success('Login successful!');
      navigate('/upload');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1>Login</h1>
      <p>{step === 1 ? 'Sign in to view your reports or submit new evidence.' : 'Enter the code sent to your email. (Please check your SPAM folder)'}</p>

      {/* Errors are now handled by toast notifications */}

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
            {loading ? <span className="spinner"></span> : 'Send OTP'}
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
            {loading ? <span className="spinner"></span> : 'Verify & Login'}
          </button>
          
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '16px', padding: '16px', borderRadius: '8px' }}
            disabled={resendTimer > 0}
            onClick={handleResendOtp}
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '16px', padding: '16px', borderRadius: '8px', border: 'none', background: 'transparent', textDecoration: 'underline' }}
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
