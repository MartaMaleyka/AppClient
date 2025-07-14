import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormBuilder.css';

interface GlobalValidation {
  id: number;
  name: string;
  description: string;
  validation_type: string;
  validation_rule: string;
  error_message: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'time' | 'datetime-local' | 'file' | 'rating' | 'scale';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [globalValidations, setGlobalValidations] = useState<GlobalValidation[]>([]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
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

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  // Funciones para skip logic
  const toggleSkipLogic = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (!question.skip_logic) {
      question.skip_logic = {
        enabled: true,
        conditions: []
      };
    } else {
      question.skip_logic.enabled = !question.skip_logic.enabled;
    }
    
    setQuestions(updatedQuestions);
  };

  const addSkipCondition = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (!question.skip_logic) {
      question.skip_logic = {
        enabled: true,
        conditions: []
      };
    }
    
    question.skip_logic.conditions.push({
      option: '',
      skip_to_question: 0
    });
    
    setQuestions(updatedQuestions);
  };

  const updateSkipCondition = (questionIndex: number, conditionIndex: number, field: 'option' | 'skip_to_question', value: string | number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (question.skip_logic && question.skip_logic.conditions[conditionIndex]) {
      if (field === 'option') {
        question.skip_logic.conditions[conditionIndex].option = value as string;
      } else {
        question.skip_logic.conditions[conditionIndex].skip_to_question = value as number;
      }
      setQuestions(updatedQuestions);
    }
  };

  const removeSkipCondition = (questionIndex: number, conditionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (question.skip_logic) {
      question.skip_logic.conditions.splice(conditionIndex, 1);
      setQuestions(updatedQuestions);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('El título del formulario es obligatorio');
      return;
    }

    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question_text.trim()) {
        setError(`La pregunta ${i + 1} debe tener texto`);
        return;
      }

      if (['radio', 'checkbox', 'select'].includes(question.question_type) && question.options.length === 0) {
        setError(`La pregunta ${i + 1} debe tener al menos una opción`);
        return;
      }

      // Validar skip logic
      if (question.skip_logic?.enabled) {
        for (const condition of question.skip_logic.conditions) {
          if (!condition.option.trim()) {
            setError(`La condición de salto en la pregunta ${i + 1} debe tener una opción seleccionada`);
            return;
          }
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map(q => ({
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            required: q.required,
            skip_logic: q.skip_logic
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el formulario');
      }

      const result = await response.json();
      navigate(`/form/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-builder-container">
      <div className="form-builder-header">
        <h1>Crear Nuevo Formulario</h1>
        <p>Diseña tu formulario personalizado con preguntas y lógica condicional</p>
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
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito del formulario..."
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
              <p>No hay preguntas agregadas. Haz clic en "Agregar Pregunta" para comenzar.</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <div className="question-header">
                    <h3>Pregunta {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="remove-question-btn"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="question-content">
                    <div className="form-group">
                      <label>Texto de la pregunta *</label>
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                        placeholder="Escribe tu pregunta aquí..."
                        required
                      />
                    </div>

                    <div className="question-settings">
                      <div className="form-group">
                        <label>Tipo de pregunta</label>
                        <select
                          value={question.question_type}
                          onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                        >
                          <option value="text">Texto</option>
                          <option value="textarea">Área de texto</option>
                          <option value="radio">Opción única</option>
                          <option value="checkbox">Múltiples opciones</option>
                          <option value="select">Lista desplegable</option>
                          <option value="date">Fecha</option>
                          <option value="time">Hora</option>
                          <option value="datetime-local">Fecha y hora</option>
                          <option value="file">Archivo</option>
                          <option value="rating">Calificación</option>
                          <option value="scale">Escala</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          />
                          Pregunta obligatoria
                        </label>
                      </div>
                    </div>

                    {['radio', 'checkbox', 'select'].includes(question.question_type) && (
                      <div className="options-section">
                        <label>Opciones</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="option-item">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Opción ${optionIndex + 1}`}
                            />
                            {question.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                className="remove-option-btn"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="add-option-btn"
                        >
                          + Agregar Opción
                        </button>
                      </div>
                    )}

                    {/* Skip Logic Section */}
                    {['radio', 'checkbox', 'select'].includes(question.question_type) && (
                      <div className="skip-logic-section">
                        <div className="skip-logic-header">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={question.skip_logic?.enabled || false}
                              onChange={() => toggleSkipLogic(index)}
                            />
                            <span className="skip-logic-label">Lógica de saltos condicionales</span>
                          </label>
                        </div>

                        {question.skip_logic?.enabled && (
                          <>
                            <div className="skip-logic-info">
                              <p>Configura condiciones para mostrar u ocultar preguntas basándose en las respuestas.</p>
                            </div>

                            <div className="skip-conditions">
                              {question.skip_logic.conditions.map((condition, conditionIndex) => (
                                <div key={conditionIndex} className="skip-condition">
                                  <div className="condition-header">
                                    <span className="condition-label">Condición {conditionIndex + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeSkipCondition(index, conditionIndex)}
                                      className="remove-condition-btn"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                  
                                  <div className="condition-content">
                                    <div className="condition-part">
                                      <label>Si selecciona:</label>
                                      <select
                                        className="condition-select"
                                        value={condition.option}
                                        onChange={(e) => updateSkipCondition(index, conditionIndex, 'option', e.target.value)}
                                      >
                                        <option value="">Selecciona una opción...</option>
                                        {question.options.map((option, optionIndex) => (
                                          <option key={optionIndex} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div className="condition-part">
                                      <label>Entonces saltar a:</label>
                                      <select
                                        className="condition-select"
                                        value={condition.skip_to_question}
                                        onChange={(e) => updateSkipCondition(index, conditionIndex, 'skip_to_question', parseInt(e.target.value))}
                                      >
                                        <option value={0}>Finalizar formulario</option>
                                        {questions.map((q, qIndex) => (
                                          <option key={qIndex} value={qIndex + 1}>
                                            Pregunta {qIndex + 1}: {q.question_text.substring(0, 50)}...
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => addSkipCondition(index)}
                                className="add-condition-btn"
                              >
                                + Agregar Condición
                              </button>
                            </div>

                            <div className="skip-logic-help">
                              <p><strong>💡 Consejo:</strong> Usa esta función para crear formularios dinámicos. Por ejemplo, si alguien responde "No" a una pregunta, puedes saltar directamente a otra pregunta relevante.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}


                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creando formulario...' : 'Crear Formulario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder; 