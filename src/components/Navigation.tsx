import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          📋 Forms App
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Mis Formularios</Link>
          <Link to="/create" className="nav-link">Crear Formulario</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 