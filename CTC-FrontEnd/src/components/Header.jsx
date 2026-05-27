import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, LogOut, FileText, ChevronDown, ClipboardPen } from 'lucide-react';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userEmail = localStorage.getItem('userEmail') || '';
  // Fallback to "User" if no name is available yet, or extract from email
  const defaultName = userEmail ? userEmail.split('@')[0] : 'User';
  const userName = localStorage.getItem('userName') || defaultName;

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuth(localStorage.getItem('isAuth') === 'true');
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.dispatchEvent(new Event('authChange'));
    toast.success('Logged out successfully');
    setIsDropdownOpen(false);
    navigate('/');
  };

  const handleDropdownItemClick = (path) => {
    setIsDropdownOpen(false);
    if (path) {
      navigate(path);
    }
  };

  return (
    <header className="app-header">
      <Link to={isAuth ? '/upload' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/CTC_Main.png" alt="CTC App Logo" style={{ height: '32px' }} />
        <h1>CTC App</h1>
      </Link>
      
      {isAuth && (
        <div className="dropdown-container" ref={dropdownRef}>
          <button 
            className="dropdown-button" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <User size={18} />
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </span>
            <ChevronDown size={16} />
          </button>
          
          <div className={`dropdown-menu ${isDropdownOpen ? 'active' : ''}`}>
            <button className="dropdown-item" onClick={() => handleDropdownItemClick('/upload')}>
              <ClipboardPen size={16} />
              File Report
            </button>
            <button className="dropdown-item" onClick={() => handleDropdownItemClick('/profile')}>
              <User size={16} />
              My Profile
            </button>
            <button className="dropdown-item" onClick={() => handleDropdownItemClick('/history')}>
              <FileText size={16} />
              My Report History
            </button>
            <button className="dropdown-item logout" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
