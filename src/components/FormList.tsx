import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './FormList.css';

interface Form {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

const FormList: React.FC = () => {
  const { token } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al cargar formularios');
      }
      const data = await response.json();
      setForms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este formulario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      console.log('Attempting to delete form:', formId);
      console.log('Token:', token);
      
      const response = await fetch(`http://localhost:5000/api/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Error al eliminar formulario: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log('Delete successful:', result);
      
      // Remove the form from the local state
      setForms(forms.filter(form => form.id !== formId));
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="form-list-container">
        <div className="loading">Cargando formularios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-list-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="form-list-container">
      <div className="form-list-header">
        <h1>Mis Formularios CSS</h1>
        <Link to="/create" className="create-form-btn">
          + Crear Nuevo Formulario CSS
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No tienes formularios CSS aún</h2>
          <p>Crea tu primer formulario CSS para empezar a recopilar respuestas</p>
          <Link to="/create" className="create-form-btn">
            Crear mi primer formulario CSS
          </Link>
        </div>
      ) : (
        <div className="forms-grid">
          {forms.map((form) => (
            <div key={form.id} className="form-card">
              <div className="form-card-header">
                <h3>{form.title}</h3>
                <span className="form-date">{formatDate(form.created_at)}</span>
              </div>
              {form.description && (
                <p className="form-description">{form.description}</p>
              )}
              <div className="form-card-actions">
                <Link 
                  to={`/form/${form.id}`} 
                  className="form-action-btn view-btn"
                >
                  👁️ Ver Formulario
                </Link>
                <Link 
                  to={`/form/${form.id}/responses`} 
                  className="form-action-btn responses-btn"
                >
                  📊 Ver Respuestas
                </Link>
                <button 
                  onClick={() => deleteForm(form.id)}
                  className="form-action-btn delete-btn"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList; 