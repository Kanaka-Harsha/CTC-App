import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone_no: '',
    email: '',
    aadhaar_hash: '',
    user_location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone_no)) {
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!/^\d{12}$/.test(formData.aadhaar_hash)) {
      toast.error("Aadhaar number must be exactly 12 digits");
      return false;
    }
    if (!formData.user_location.trim()) {
      toast.error("Location is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    console.log('[Register] Step 1: Submitting registration form', formData);
    setLoading(true);

    try {
      // Hash the Aadhaar number client-side using SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(formData.aadhaar_hash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedAadhaar = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const submissionData = {
        ...formData,
        aadhaar_hash: hashedAadhaar
      };

      // Sending as query parameters because the FastAPI backend expects query parameters
      const queryParams = new URLSearchParams(submissionData).toString();
      const response = await fetch(`${API_BASE_URL}/users/register?${queryParams}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Register] Registration failed:', errorData.detail);
        throw new Error(errorData.detail || 'Registration failed');
      }

      console.log('[Register] Registration successful! Redirecting to /login...');
      toast.success('Registration successful! Please check your email (and SPAM folder) for confirmation, then login.', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1>Create Account</h1>
      <p>Register to submit official incident reports.</p>

      {/* Errors are now handled by toast notifications */}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder="As per official ID" required />
        </div>

        <div className="input-group">
          <label htmlFor="phone_no">Phone Number</label>
          <input type="tel" id="phone_no" value={formData.phone_no} onChange={handleChange} placeholder="10-digit mobile number" required />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" required />
        </div>

        <div className="input-group">
          <label htmlFor="aadhaar_hash">Aadhaar Number</label>
          <input type="text" id="aadhaar_hash" value={formData.aadhaar_hash} onChange={handleChange} placeholder="12-digit Aadhaar number" required />
        </div>

        <div className="input-group">
          <label htmlFor="user_location">Location</label>
          <input type="text" id="user_location" value={formData.user_location} onChange={handleChange} placeholder="Your City/Area" required />
        </div>

        <button type="submit" className="btn-primary" style={{ marginBottom: 'var(--spacing-lg)' }} disabled={loading}>
          {loading ? <span className="spinner"></span> : 'Complete Registration'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <p>Already have an account?</p>
        <Link to="/login" className="btn-secondary">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default Register;
