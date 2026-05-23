import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <header className="app-header">
      <Link to="/">
        <h1>CTC App</h1>
      </Link>
      {!isLogin && <Link to="/login">Login</Link>}
    </header>
  );
}

export default Header;
