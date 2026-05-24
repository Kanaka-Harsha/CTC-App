import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuth(localStorage.getItem('isAuth') === 'true');
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  return (
    <header className="app-header">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/CTC_Main.png" alt="CTC App Logo" style={{ height: '32px' }} />
        <h1>CTC App</h1>
      </Link>
      {!isAuth && !isLoginPage && <Link to="/login" className="btn-nav">Login</Link>}
      {isAuth && <button onClick={handleLogout} className="btn-nav" style={{ border: 'none', cursor: 'pointer' }}>Logout</button>}
    </header>
  );
}

export default Header;
