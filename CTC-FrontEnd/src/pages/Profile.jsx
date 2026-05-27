import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem('userEmail');
        
        if (!email) {
          toast.error('User not found. Please log in again.');
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_BASE_URL}/report/profile?email=${email}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        
        setProfileData({
          user_id: data.user_id,
          name: data.name,
          phone_no: data.phone_no,
          email: data.email,
          address: data.address
        });

        // Optionally, save name for Header.jsx
        localStorage.setItem('userName', data.name);
        window.dispatchEvent(new Event('authChange'));

      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="page-container" style={{ textAlign: 'center', marginTop: '40px' }}>Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="page-container" style={{ textAlign: 'center', marginTop: '40px' }}>No profile data found.</div>;
  }

  return (
    <div className="page-container">
      <div className="glass-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ marginBottom: '4px' }}>{profileData.name}</h1>
            <p style={{ margin: 0 }}>Citizenship Status: Verified</p>
          </div>
        </div>
        
        <h2 style={{ marginBottom: '24px' }}>Personal Information</h2>
        
        <div className="profile-info">
          <div className="info-item">
            <span className="info-label"><Hash size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> User ID</span>
            <span className="info-value">{profileData.user_id}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label"><Phone size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Phone Number</span>
            <span className="info-value">{profileData.phone_no}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label"><Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Email Address</span>
            <span className="info-value">{profileData.email}</span>
          </div>
          
          <div className="info-item" style={{ gridColumn: '1 / -1' }}>
            <span className="info-label"><MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Address</span>
            <span className="info-value">{profileData.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
