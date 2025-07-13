import React, { useState, useEffect } from 'react';
import './TemplateManager.css';

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  created_by_username: string;
  created_at: string;
  questions: any[];
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  questions: any[];
}

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: '',
    is_public: false,
    questions: []
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/templates/public');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error('Error fetching templates');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/templates/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      is_public: false,
      questions: []
    });
    setShowModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      is_public: template.is_public,
      questions: template.questions
    });
    setShowModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        fetchTemplates();
        alert(editingTemplate ? 'Plantilla actualizada exitosamente!' : 'Plantilla creada exitosamente!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar plantilla');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchTemplates();
        alert('Plantilla eliminada exitosamente!');
      } else {
        alert('Error al eliminar plantilla');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar plantilla');
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      const response = await fetch('http://localhost:5000/api/forms/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          template_id: template.id,
          form_data: {
            title: `Formulario desde ${template.name}`,
            description: `Creado desde plantilla: ${template.name}`
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('¡Formulario creado exitosamente!');
        // Redirect to form builder or form list
        window.location.href = `/forms/${result.id}`;
      } else {
        alert('Error al crear formulario desde plantilla');
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Error al usar plantilla');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="template-manager">
      <div className="template-header">
        <h2>Administrador de Plantillas</h2>
        <button className="create-template-btn" onClick={handleCreateTemplate}>
          Crear Plantilla
        </button>
      </div>

      <div className="template-filters">
        <div className="filter-group">
          <label>Categoría</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron plantillas</h3>
          <p>
            {searchTerm || selectedCategory !== 'all' 
              ? 'Intenta ajustar tus criterios de búsqueda o filtros.'
              : '¡Crea tu primera plantilla para comenzar!'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button className="create-template-btn" onClick={handleCreateTemplate}>
              Crear Tu Primera Plantilla
            </button>
          )}
        </div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <h3>{template.name}</h3>
              <span className="category">{template.category}</span>
              <p className="description">{template.description}</p>
              
              <div className="meta">
                <span>Por {template.created_by_username}</span>
                <span>{formatDate(template.created_at)}</span>
              </div>

              <div className="stats">
                <div className="stat-item">
                  <span className="stat-number">{template.questions.length}</span>
                  <span className="stat-label">Preguntas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{template.is_public ? 'Pública' : 'Privada'}</span>
                  <span className="stat-label">Visibilidad</span>
                </div>
              </div>

              <div className="template-actions">
                <button 
                  className="template-btn use-template-btn"
                  onClick={() => handleUseTemplate(template)}
                >
                  Usar Plantilla
                </button>
                <button 
                  className="template-btn edit-template-btn"
                  onClick={() => handleEditTemplate(template)}
                >
                  Editar
                </button>
                <button 
                  className="template-btn delete-template-btn"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="template-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingTemplate ? 'Editar Plantilla' : 'Crear Plantilla'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Nombre de la Plantilla</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ingresa el nombre de la plantilla"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ingresa la descripción de la plantilla"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                />
                <label htmlFor="is_public">Plantilla pública</label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={handleSaveTemplate}>
                {editingTemplate ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager; 