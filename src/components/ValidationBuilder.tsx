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
      const response = await fetch('/api/validations', {
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
        ? `/api/validations/${editingValidation.id}`
        : '/api/validations';
      
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
        alert(editingValidation ? 'Validation updated successfully!' : 'Validation created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving validation:', error);
      alert('Error saving validation');
    }
  };

  const handleDeleteValidation = async (validationId: number) => {
    if (!window.confirm('Are you sure you want to delete this validation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/validations/${validationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchValidations();
        alert('Validation deleted successfully!');
      } else {
        alert('Error deleting validation');
      }
    } catch (error) {
      console.error('Error deleting validation:', error);
      alert('Error deleting validation');
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
      alert('Please enter a test value');
      return;
    }

    try {
      const response = await fetch('/api/validations/test', {
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
        setTestResult({ success: false, message: 'Error testing validation' });
      }
    } catch (error) {
      console.error('Error testing validation:', error);
      setTestResult({ success: false, message: 'Error testing validation' });
    }
  };

  const getValidationTypeLabel = (type: string) => {
    switch (type) {
      case 'regex': return 'Regular Expression';
      case 'length': return 'Length Check';
      case 'range': return 'Range Check';
      case 'custom': return 'Custom Function';
      case 'email': return 'Email Validation';
      case 'url': return 'URL Validation';
      case 'phone': return 'Phone Number';
      default: return type;
    }
  };

  const getParameterFields = () => {
    switch (formData.validation_type) {
      case 'regex':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Regular Expression Pattern</label>
              <input
                type="text"
                value={formData.parameters.pattern || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, pattern: e.target.value }
                })}
                placeholder="Enter regex pattern"
              />
            </div>
            <div className="param-group">
              <label>Flags (optional)</label>
              <input
                type="text"
                value={formData.parameters.flags || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, flags: e.target.value }
                })}
                placeholder="e.g., gi, m"
              />
            </div>
          </div>
        );

      case 'length':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Minimum Length</label>
              <input
                type="number"
                value={formData.parameters.min_length || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, min_length: parseInt(e.target.value) }
                })}
                placeholder="Minimum length"
              />
            </div>
            <div className="param-group">
              <label>Maximum Length</label>
              <input
                type="number"
                value={formData.parameters.max_length || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, max_length: parseInt(e.target.value) }
                })}
                placeholder="Maximum length"
              />
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Minimum Value</label>
              <input
                type="number"
                value={formData.parameters.min_value || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, min_value: parseFloat(e.target.value) }
                })}
                placeholder="Minimum value"
              />
            </div>
            <div className="param-group">
              <label>Maximum Value</label>
              <input
                type="number"
                value={formData.parameters.max_value || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, max_value: parseFloat(e.target.value) }
                })}
                placeholder="Maximum value"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="validation-params">
            <div className="param-group">
              <label>Custom Function (JavaScript)</label>
              <textarea
                value={formData.parameters.function || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, function: e.target.value }
                })}
                placeholder="function(value) { return value.length > 0; }"
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
        <h2>Validation Builder</h2>
        <button className="add-validation-btn" onClick={handleCreateValidation}>
          Add Validation
        </button>
      </div>

      {validations.length === 0 ? (
        <div className="empty-validations">
          <h3>No validations found</h3>
          <p>Create your first validation rule to get started!</p>
          <button className="add-validation-btn" onClick={handleCreateValidation}>
            Create First Validation
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
                  Test
                </button>
                <button 
                  className="validation-btn edit-validation-btn"
                  onClick={() => handleEditValidation(validation)}
                >
                  Edit
                </button>
                <button 
                  className="validation-btn delete-validation-btn"
                  onClick={() => handleDeleteValidation(validation.id)}
                >
                  Delete
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
              <h3>{editingValidation ? 'Edit Validation' : 'Create Validation'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Validation Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter validation name"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter validation description"
              />
            </div>

            <div className="form-group">
              <label>Validation Type</label>
              <select
                value={formData.validation_type}
                onChange={(e) => setFormData({...formData, validation_type: e.target.value})}
              >
                <option value="regex">Regular Expression</option>
                <option value="length">Length Check</option>
                <option value="range">Range Check</option>
                <option value="custom">Custom Function</option>
                <option value="email">Email Validation</option>
                <option value="url">URL Validation</option>
                <option value="phone">Phone Number</option>
              </select>
            </div>

            {getParameterFields()}

            <div className="form-group">
              <label>Error Message</label>
              <input
                type="text"
                value={formData.error_message}
                onChange={(e) => setFormData({...formData, error_message: e.target.value})}
                placeholder="Enter error message"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                Active
              </label>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveValidation}>
                {editingValidation ? 'Update Validation' : 'Create Validation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && testValidation && (
        <div className="test-modal">
          <div className="test-content">
            <div className="test-header">
              <h3>Test Validation: {testValidation.name}</h3>
              <button className="close-btn" onClick={() => setShowTestModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Test Value</label>
              <input
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Enter value to test"
              />
            </div>

            <button className="modal-btn save-btn" onClick={handleRunTest}>
              Run Test
            </button>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? '✓ Validation passed' : '✗ Validation failed'}
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