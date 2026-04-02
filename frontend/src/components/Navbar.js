import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span>🥘</span> Pantry Pal
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          {user && <Link to="/my-recipes" className={isActive('/my-recipes')}>My Recipes</Link>}
          {user && <Link to="/pantry" className={isActive('/pantry')}>My Pantry</Link>}
          {user?.is_staff && <Link to="/admin-panel" className={isActive('/admin-panel')}>Admin</Link>}
          {user ? (
            <>
              <Link to="/recipes/new" className="nav-btn" style={{marginLeft:8}}>+ New Recipe</Link>
              <button className="nav-btn outline" onClick={handleLogout} style={{marginLeft:4}}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn" style={{marginLeft:4}}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
