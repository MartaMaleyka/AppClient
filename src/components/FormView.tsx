import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './FormView.css';

interface Question {
  id: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  options: string[];
  required: boolean;
}

interface Form {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface Answer {
  question_id: number;
  answer_text: string;
}

const FormView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/forms/${id}`);
      if (!response.ok) {
        throw new Error('Formulario no encontrado');
      }
      const data = await response.json();
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: number, option: string, checked: boolean) => {
    const currentAnswers = answers[questionId] as string[] || [];
    
    if (checked) {
      handleAnswerChange(questionId, [...currentAnswers, option]);
    } else {
      handleAnswerChange(questionId, currentAnswers.filter(ans => ans !== option));
    }
  };

  const validateForm = () => {
    if (!respondentName.trim()) {
      setError('Por favor ingresa tu nombre');
      return false;
    }

    for (const question of form!.questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || 
            (typeof answer === 'string' && !answer.trim()) ||
            (Array.isArray(answer) && answer.length === 0)) {
          setError(`La pregunta "${question.question_text}" es obligatoria`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersArray: Answer[] = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer_text: Array.isArray(answer) ? answer.join(', ') : answer
      }));

      const response = await fetch(`http://localhost:5000/api/forms/${id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respondent_name: respondentName.trim(),
          answers: answersArray
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar respuestas');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const questionId = question.id;
    const currentAnswer = answers[questionId];

    return (
      <div key={questionId} className="question-container">
        <div className="question-header">
          <h3>
            {index + 1}. {question.question_text}
            {question.required && <span className="required"> *</span>}
          </h3>
        </div>

        <div className="question-content">
          {question.question_type === 'text' && (
            <input
              type="text"
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className="text-input"
            />
          )}

          {question.question_type === 'textarea' && (
            <textarea
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={4}
              className="textarea-input"
            />
          )}

          {question.question_type === 'radio' && (
            <div className="radio-options">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="radio-option">
                  <input
                    type="radio"
                    name={`question-${questionId}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  />
                  <span className="radio-label">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'checkbox' && (
            <div className="checkbox-options">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(currentAnswer as string[] || []).includes(option)}
                    onChange={(e) => handleCheckboxChange(questionId, option, e.target.checked)}
                  />
                  <span className="checkbox-label">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'select' && (
            <select
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="select-input"
            >
              <option value="">Selecciona una opción...</option>
              {question.options.map((option, optionIndex) => (
                <option key={optionIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="form-view-container">
        <div className="loading">Cargando formulario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-view-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="back-btn">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="form-view-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>¡Respuesta enviada!</h2>
          <p>Gracias por completar el formulario.</p>
          <Link to="/" className="back-btn">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-view-container">
        <div className="error">Formulario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="form-view-container">
      <div className="form-header">
        <h1>{form.title}</h1>
        {form.description && (
          <p className="form-description">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        <div className="respondent-section">
          <h2>Tu información</h2>
          <div className="form-group">
            <label htmlFor="respondent-name">Nombre *</label>
            <input
              type="text"
              id="respondent-name"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Ingresa tu nombre"
              required
            />
          </div>
        </div>

        <div className="questions-section">
          <h2>Preguntas</h2>
          {form.questions.map((question, index) => 
            renderQuestion(question, index)
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
            disabled={submitting}
            className="submit-btn"
          >
            {submitting ? 'Enviando...' : 'Enviar Respuesta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormView; 