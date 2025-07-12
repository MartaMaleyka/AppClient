import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import NotificationBadge from './NotificationBadge.tsx';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
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
        
        {/* Menú móvil */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>

        <div className={`nav-links ${showMobileMenu ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            📝 Mis Formularios
          </Link>
          <Link to="/create" className={`nav-link ${isActive('/create') ? 'active' : ''}`}>
            ➕ Crear Formulario
          </Link>
          <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>
            📋 Plantillas
          </Link>
          
          {/* Dropdown para Analytics */}
          <div className="nav-dropdown">
            <button 
              className={`nav-link dropdown-btn ${isActive('/analytics') ? 'active' : ''}`}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              📊 Analytics
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
              <Link to="/analytics" className="dropdown-item">
                📈 Dashboard General
              </Link>
              <Link to="/audit-logs" className="dropdown-item">
                📋 Logs de Auditoría
              </Link>
            </div>
          </div>
          
          <Link to="/notifications" className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}>
            🔔 Notificaciones
            <NotificationBadge className="nav-badge" />
          </Link>
          <Link to="/validations" className={`nav-link ${isActive('/validations') ? 'active' : ''}`}>
            ✅ Validaciones
          </Link>
          <Link to="/files" className={`nav-link ${isActive('/files') ? 'active' : ''}`}>
            📁 Archivos
          </Link>
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