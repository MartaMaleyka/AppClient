import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormBuilder.css';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  options: string[];
  required: boolean;
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
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
      required: false
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

    // Validate questions
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
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map(q => ({
            question_text: q.question_text.trim(),
            question_type: q.question_type,
            options: q.question_type === 'text' || q.question_type === 'textarea' ? [] : q.options.filter(opt => opt.trim()),
            required: q.required
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
        <h1>Crear Nuevo Formulario</h1>
        <p>Diseña tu formulario personalizado</p>
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