import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './FormBuilder.css';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'time' | 'datetime-local';
  options: string[];
  required: boolean;
  skip_logic?: {
    enabled: boolean;
    conditions: {
      option: string;
      skip_to_question: number;
    }[];
  };
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_type: 'text',
      options: [''],
      required: false,
      skip_logic: {
        enabled: false,
        conditions: []
      }
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ''] }
        : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => 
              idx === optionIndex ? value : opt
            )
          }
        : q
    ));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter((_, idx) => idx !== optionIndex)
          }
        : q
    ));
  };

  const toggleSkipLogic = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            skip_logic: {
              enabled: !q.skip_logic?.enabled,
              conditions: q.skip_logic?.conditions || []
            }
          }
        : q
    ));
  };

  const addSkipCondition = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            skip_logic: {
              ...q.skip_logic!,
              conditions: [...(q.skip_logic?.conditions || []), { option: '', skip_to_question: 0 }]
            }
          }
        : q
    ));
  };

  const updateSkipCondition = (questionId: string, conditionIndex: number, field: 'option' | 'skip_to_question', value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            skip_logic: {
              ...q.skip_logic!,
              conditions: q.skip_logic?.conditions.map((cond, idx) => 
                idx === conditionIndex 
                  ? { ...cond, [field]: value }
                  : cond
              ) || []
            }
          }
        : q
    ));
  };

  const removeSkipCondition = (questionId: string, conditionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            skip_logic: {
              ...q.skip_logic!,
              conditions: q.skip_logic?.conditions.filter((_, idx) => idx !== conditionIndex) || []
            }
          }
        : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta');
      return;
    }

    // Validar preguntas
    for (const question of questions) {
      if (!question.question_text.trim()) {
        setError('Todas las preguntas deben tener texto');
        return;
      }
      
      if (['radio', 'checkbox', 'select'].includes(question.question_type)) {
        if (question.options.length === 0 || question.options.some(opt => !opt.trim())) {
          setError('Las preguntas de opciones múltiples deben tener al menos una opción válida');
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map(q => ({
            question_text: q.question_text.trim(),
            question_type: q.question_type,
            options: ['text', 'textarea', 'date', 'time', 'datetime-local'].includes(q.question_type) ? [] : q.options.filter(opt => opt.trim()),
            required: q.required,
            skip_logic: q.skip_logic
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el formulario');
      }

      const data = await response.json();
      navigate(`/form/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-builder-container">
      <div className="form-builder-header">
        <h1>Crear Nuevo Formulario CSS</h1>
        <p>Diseña tu formulario personalizado con estilos modernos</p>
      </div>

      <form onSubmit={handleSubmit} className="form-builder-form">
        <div className="form-section">
          <h2>Información del Formulario</h2>
          
          <div className="form-group">
            <label htmlFor="title">Título del formulario *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Encuesta de Satisfacción"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción (opcional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito de este formulario..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Preguntas</h2>
            <button 
              type="button" 
              onClick={addQuestion}
              className="add-question-btn"
            >
              + Agregar Pregunta
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="empty-questions">
              <p>No hay preguntas aún. Haz clic en "Agregar Pregunta" para empezar.</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Pregunta {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="remove-question-btn"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="question-content">
                    <div className="form-group">
                      <label>Texto de la pregunta *</label>
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                        placeholder="Escribe tu pregunta aquí..."
                        required
                      />
                    </div>

                    <div className="question-settings">
                      <div className="form-group">
                        <label>Tipo de pregunta</label>
                        <select
                          value={question.question_type}
                          onChange={(e) => updateQuestion(question.id, 'question_type', e.target.value)}
                        >
                          <option value="text">Texto corto</option>
                          <option value="textarea">Texto largo</option>
                          <option value="radio">Opción única</option>
                          <option value="checkbox">Múltiples opciones</option>
                          <option value="select">Lista desplegable</option>
                          <option value="date">Fecha</option>
                          <option value="time">Hora</option>
                          <option value="datetime-local">Fecha y Hora</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                          />
                          Pregunta obligatoria
                        </label>
                      </div>
                    </div>

                    {['radio', 'checkbox', 'select'].includes(question.question_type) && (
                      <div className="options-section">
                        <label>Opciones *</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="option-input">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Opción ${optionIndex + 1}`}
                              required
                            />
                            {question.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(question.id, optionIndex)}
                                className="remove-option-btn"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="add-option-btn"
                        >
                          + Agregar Opción
                        </button>
                      </div>
                    )}

                    {/* Lógica de Saltos */}
                    <div className="skip-logic-section">
                      <div className="skip-logic-header">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={question.skip_logic?.enabled || false}
                            onChange={() => toggleSkipLogic(question.id)}
                          />
                          <span className="skip-logic-label">Mostrar/ocultar preguntas según respuesta</span>
                        </label>
                      </div>

                      {question.skip_logic?.enabled && (
                        <div className="skip-conditions">
                          <div className="skip-logic-info">
                            <p>Configura qué preguntas mostrar u ocultar según la respuesta del usuario:</p>
                          </div>
                          
                          {question.skip_logic.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex} className="skip-condition">
                              <div className="condition-header">
                                <span className="condition-label">Condición {conditionIndex + 1}:</span>
                                <button
                                  type="button"
                                  onClick={() => removeSkipCondition(question.id, conditionIndex)}
                                  className="remove-condition-btn"
                                  title="Eliminar condición"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="condition-content">
                                <div className="condition-part">
                                  <label>Si el usuario selecciona:</label>
                                  <select
                                    value={condition.option}
                                    onChange={(e) => updateSkipCondition(question.id, conditionIndex, 'option', e.target.value)}
                                    className="condition-select"
                                  >
                                    <option value="">Seleccionar opción</option>
                                    {question.options.map((option, idx) => (
                                      <option key={idx} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="condition-part">
                                  <label>Entonces:</label>
                                  <select
                                    value={condition.skip_to_question}
                                    onChange={(e) => updateSkipCondition(question.id, conditionIndex, 'skip_to_question', parseInt(e.target.value))}
                                    className="condition-select"
                                  >
                                    <option value={0}>Finalizar formulario</option>
                                    {questions.map((q, idx) => (
                                      <option key={q.id} value={idx + 1}>Ir a Pregunta {idx + 1}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => addSkipCondition(question.id)}
                            className="add-condition-btn"
                          >
                            + Agregar otra condición
                          </button>
                          
                          <div className="skip-logic-help">
                            <p><strong>Nota:</strong> Las preguntas se ocultarán automáticamente cuando se cumplan las condiciones configuradas.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Creando...' : 'Crear Formulario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder; 