import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          📋 Forms CSS
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Mis Formularios CSS</Link>
          <Link to="/create" className="nav-link">Crear Formulario CSS</Link>
        </div>
        <div className="nav-user">
          <span className="user-info">
            👤 {user?.username}
          </span>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 