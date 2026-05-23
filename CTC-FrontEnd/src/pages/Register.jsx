import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone_no: '',
    aadhaar_hash: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sending as query parameters because the FastAPI backend expects query parameters
      const queryParams = new URLSearchParams(formData).toString();
      const response = await fetch(`http://127.0.0.1:8000/users/register?${queryParams}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Account</h1>
      <p>Register to submit official incident reports.</p>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

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
          <label htmlFor="aadhaar_hash">Aadhaar Number</label>
          <input type="text" id="aadhaar_hash" value={formData.aadhaar_hash} onChange={handleChange} placeholder="12-digit Aadhaar number" required />
        </div>

        <button type="submit" className="btn-primary" style={{ marginBottom: 'var(--spacing-lg)' }} disabled={loading}>
          {loading ? 'Registering...' : 'Complete Registration'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <p>Already have an account?</p>
        <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default Register;
