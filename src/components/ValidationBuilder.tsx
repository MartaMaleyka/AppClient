import React, { useState, useEffect } from 'react';
import './ValidationBuilder.css';

interface Validation {
  id: number;
  name: string;
  description: string;
  validation_type: 'regex' | 'length' | 'range' | 'custom' | 'email' | 'url' | 'phone';
  parameters: Record<string, any>;
  error_message: string;
  is_active: boolean;
  created_by_username: string;
  created_at: string;
}

interface ValidationFormData {
  name: string;
  description: string;
  validation_type: string;
  parameters: Record<string, any>;
  error_message: string;
  is_active: boolean;
}

const ValidationBuilder: React.FC = () => {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingValidation, setEditingValidation] = useState<Validation | null>(null);
  const [testValidation, setTestValidation] = useState<Validation | null>(null);
  const [testValue, setTestValue] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<ValidationFormData>({
    name: '',
    description: '',
    validation_type: 'regex',
    parameters: {},
    error_message: '',
    is_active: true
  });

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/validations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setValidations(data);
      } else {
        console.error('Error fetching validations');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateValidation = () => {
    setEditingValidation(null);
    setFormData({
      name: '',
      description: '',
      validation_type: 'regex',
      parameters: {},
      error_message: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditValidation = (validation: Validation) => {
    setEditingValidation(validation);
    setFormData({
      name: validation.name,
      description: validation.description,
      validation_type: validation.validation_type,
      parameters: validation.parameters,
      error_message: validation.error_message,
      is_active: validation.is_active
    });
    setShowModal(true);
  };

  const handleSaveValidation = async () => {
    try {
      const url = editingValidation 
        ? `http://localhost:5000/api/validations/${editingValidation.id}`
        : 'http://localhost:5000/api/validations';
      
      const method = editingValidation ? 'PUT' : 'POST';
      
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
        fetchValidations();
        alert(editingValidation ? '¡Validación actualizada exitosamente!' : '¡Validación creada exitosamente!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error saving validation:', error);
      alert('Error al guardar la validación');
    }
  };

  const handleDeleteValidation = async (validationId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta validación?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/validations/${validationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchValidations();
        alert('¡Validación eliminada exitosamente!');
      } else {
        alert('Error al eliminar la validación');
      }
    } catch (error) {
      console.error('Error deleting validation:', error);
      alert('Error al eliminar la validación');
    }
  };

  const handleTestValidation = async (validation: Validation) => {
    setTestValidation(validation);
    setTestValue('');
    setTestResult(null);
    setShowTestModal(true);
  };

  const handleRunTest = async () => {
    if (!testValidation || !testValue.trim()) {
      alert('Por favor ingresa un valor de prueba');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/validations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          validation_id: testValidation.id,
          test_value: testValue
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      } else {
        setTestResult({ success: false, message: 'Error al probar la validación' });
      }
    } catch (error) {
      console.error('Error testing validation:', error);
      setTestResult({ success: false, message: 'Error al probar la validación' });
    }
  };

  const getValidationTypeLabel = (type: string) => {
    switch (type) {
      case 'regex': return 'Expresión Regular';
      case 'length': return 'Verificación de Longitud';
      case 'range': return 'Verificación de Rango';
      case 'custom': return 'Función Personalizada';
      case 'email': return 'Validación de Email';
      case 'url': return 'Validación de URL';
      case 'phone': return 'Número de Teléfono';
      default: return type;
    }
  };

  const getParameterFields = () => {
    switch (formData.validation_type) {
      case 'regex':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Patrón de Expresión Regular</label>
              <input
                type="text"
                value={formData.parameters.pattern || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, pattern: e.target.value }
                })}
                placeholder="Ingresa el patrón regex"
              />
            </div>
            <div className="param-group">
              <label>Banderas (opcional)</label>
              <input
                type="text"
                value={formData.parameters.flags || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, flags: e.target.value }
                })}
                placeholder="ej: gi, m"
              />
            </div>
          </div>
        );

      case 'length':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Longitud Mínima</label>
              <input
                type="number"
                value={formData.parameters.min_length || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, min_length: parseInt(e.target.value) }
                })}
                placeholder="Longitud mínima"
              />
            </div>
            <div className="param-group">
              <label>Longitud Máxima</label>
              <input
                type="number"
                value={formData.parameters.max_length || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, max_length: parseInt(e.target.value) }
                })}
                placeholder="Longitud máxima"
              />
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Valor Mínimo</label>
              <input
                type="number"
                value={formData.parameters.min_value || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, min_value: parseFloat(e.target.value) }
                })}
                placeholder="Valor mínimo"
              />
            </div>
            <div className="param-group">
              <label>Valor Máximo</label>
              <input
                type="number"
                value={formData.parameters.max_value || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, max_value: parseFloat(e.target.value) }
                })}
                placeholder="Valor máximo"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Función Personalizada (JavaScript)</label>
              <textarea
                value={formData.parameters.function || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, function: e.target.value }
                })}
                placeholder="función(value) { return value.length > 0; }"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
    <div className="validation-builder">
      <div className="validation-header">
        <h2>Constructor de Validaciones</h2>
        <button className="add-validation-btn" onClick={handleCreateValidation}>
          Agregar Validación
        </button>
      </div>

      {validations.length === 0 ? (
        <div className="empty-validations">
          <h3>No se encontraron validaciones</h3>
          <p>¡Crea tu primera regla de validación para empezar!</p>
          <button className="add-validation-btn" onClick={handleCreateValidation}>
            Crear Primera Validación
          </button>
        </div>
      ) : (
        <div className="validation-list">
          {validations.map(validation => (
            <div key={validation.id} className="validation-card">
              <div className="validation-header-info">
                <div className="validation-info">
                  <h3>{validation.name}</h3>
                  <span className="validation-type">
                    {getValidationTypeLabel(validation.validation_type)}
                  </span>
                  <p className="validation-description">{validation.description}</p>
                </div>
              </div>

              <div className="validation-meta">
                <span>By {validation.created_by_username}</span>
                <span>{formatDate(validation.created_at)}</span>
              </div>

              <div className="validation-actions">
                <button 
                  className="validation-btn test-validation-btn"
                  onClick={() => handleTestValidation(validation)}
                >
                  Probar
                </button>
                <button 
                  className="validation-btn edit-validation-btn"
                  onClick={() => handleEditValidation(validation)}
                >
                  Editar
                </button>
                <button 
                  className="validation-btn delete-validation-btn"
                  onClick={() => handleDeleteValidation(validation.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="validation-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingValidation ? 'Editar Validación' : 'Crear Validación'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Nombre de la Validación</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ingresa el nombre de la validación"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ingresa la descripción de la validación"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Validación</label>
              <select
                value={formData.validation_type}
                onChange={(e) => setFormData({...formData, validation_type: e.target.value})}
              >
                <option value="regex">Expresión Regular</option>
                <option value="length">Verificación de Longitud</option>
                <option value="range">Verificación de Rango</option>
                <option value="custom">Función Personalizada</option>
                <option value="email">Validación de Email</option>
                <option value="url">Validación de URL</option>
                <option value="phone">Número de Teléfono</option>
              </select>
            </div>

            {getParameterFields()}

            <div className="form-group">
              <label>Mensaje de Error</label>
              <input
                type="text"
                value={formData.error_message}
                onChange={(e) => setFormData({...formData, error_message: e.target.value})}
                placeholder="Ingresa el mensaje de error"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                Activa
              </label>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveValidation}>
                {editingValidation ? 'Actualizar Validación' : 'Crear Validación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && testValidation && (
        <div className="test-modal">
          <div className="test-content">
            <div className="test-header">
              <h3>Probar Validación: {testValidation.name}</h3>
              <button className="close-btn" onClick={() => setShowTestModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Valor de Prueba</label>
              <input
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Ingresa el valor a probar"
              />
            </div>

            <button className="modal-btn save-btn" onClick={handleRunTest}>
              Ejecutar Prueba
            </button>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? '✓ Validación exitosa' : '✗ Validación falló'}
                <br />
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationBuilder; 