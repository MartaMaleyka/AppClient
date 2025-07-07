import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './FormView.css';

interface Question {
  id: number;
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
  const [visibleQuestions, setVisibleQuestions] = useState<number[]>([]);

  useEffect(() => {
    fetchForm();
  }, [id]);

  useEffect(() => {
    if (form) {
      calculateVisibleQuestions();
    }
  }, [form, answers]);

  const calculateVisibleQuestions = () => {
    if (!form) return;

    console.log('=== INICIO CÁLCULO DE PREGUNTAS VISIBLES ===');
    console.log('Respuestas actuales:', answers);

    // Inicialmente, todas las preguntas son visibles
    let visible = form.questions.map(q => q.id);
    console.log('Preguntas inicialmente visibles:', visible);

    // Aplicar lógica de saltos de manera secuencial
    for (let i = 0; i < form.questions.length; i++) {
      const question = form.questions[i];
      const questionId = question.id;
      
      console.log(`\n--- Evaluando pregunta ${i + 1}: ${question.question_text} ---`);
      console.log('Skip logic:', question.skip_logic);
      console.log('Respuesta actual:', answers[questionId]);
      
      // Solo evaluar si la pregunta actual es visible y tiene skip_logic habilitado
      if (visible.includes(questionId) && question.skip_logic?.enabled && answers[questionId]) {
        const answer = answers[questionId];
        console.log('Respuesta para saltos:', answer);
        
        // Buscar condición que coincida
        const skipCondition = question.skip_logic.conditions.find(condition => {
          const matches = Array.isArray(answer) 
            ? answer.includes(condition.option)
            : answer === condition.option;
          console.log(`Comparando "${answer}" con "${condition.option}": ${matches}`);
          return matches;
        });

        if (skipCondition) {
          console.log('✅ Condición de salto encontrada:', skipCondition);
          
          if (skipCondition.skip_to_question === 0) {
            // Ocultar todas las preguntas después de esta
            const beforeFilter = [...visible];
            visible = visible.filter(id => {
              const qIndex = form.questions.findIndex(q => q.id === id);
              return qIndex <= i;
            });
            console.log('Ocultando todas las preguntas después de la actual');
            console.log('Antes del filtro:', beforeFilter);
            console.log('Después del filtro:', visible);
          } else {
            // Ocultar preguntas entre la actual y la de destino
            const targetIndex = skipCondition.skip_to_question - 1;
            console.log(`🎯 Saltando de pregunta ${i + 1} a pregunta ${targetIndex + 1}`);
            
            if (targetIndex >= 0 && targetIndex < form.questions.length) {
              const beforeFilter = [...visible];
              // Ocultar las preguntas que están entre la actual y la de destino
              visible = visible.filter(id => {
                const qIndex = form.questions.findIndex(q => q.id === id);
                // Mantener la pregunta actual y la de destino, ocultar las del medio
                const shouldKeep = qIndex <= i || qIndex >= targetIndex;
                console.log(`Pregunta ${qIndex + 1} (ID: ${id}): ${shouldKeep ? 'MANTENER' : 'OCULTAR'}`);
                return shouldKeep;
              });
              console.log('Antes del filtro:', beforeFilter);
              console.log('Después del filtro:', visible);
            } else {
              console.log('❌ Índice de destino inválido:', targetIndex);
            }
          }
        } else {
          console.log('❌ No se encontró condición de salto');
        }
      } else {
        console.log('❌ No hay skip_logic habilitado, no hay respuesta, o la pregunta no es visible');
      }
    }

    console.log('\n=== RESULTADO FINAL ===');
    console.log('Preguntas visibles finales:', visible);
    console.log('=== FIN CÁLCULO ===\n');
    setVisibleQuestions(visible);
  };

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
    console.log(`Cambiando respuesta para pregunta ${questionId}:`, value);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Recalcular preguntas visibles inmediatamente después de cambiar una respuesta
    setTimeout(() => {
      if (form) {
        console.log('Recalculando después de cambio de respuesta...');
        calculateVisibleQuestions();
      }
    }, 100);
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
      if (question.required && visibleQuestions.includes(question.id)) {
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
      const answersArray: Answer[] = Object.entries(answers)
        .filter(([questionId]) => visibleQuestions.includes(parseInt(questionId)))
        .map(([questionId, answer]) => ({
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

  const renderQuestion = (question: Question, index: number, originalIndex: number) => {
    const questionId = question.id;
    const currentAnswer = answers[questionId];
    const isVisible = visibleQuestions.includes(questionId);

    return (
      <div 
        key={questionId} 
        className={`question-container ${isVisible ? 'question-visible' : 'question-hidden'}`}
      >
        <div className="question-header">
          <h3>
            {isVisible ? `${index}. ` : ''}{question.question_text}
            {question.required && <span className="required"> *</span>}
            {!isVisible && (
              <span className="skip-indicator"> (Oculta)</span>
            )}
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

          {question.question_type === 'date' && (
            <input
              type="date"
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="date-input"
            />
          )}

          {question.question_type === 'time' && (
            <input
              type="time"
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="time-input"
            />
          )}

          {question.question_type === 'datetime-local' && (
            <input
              type="datetime-local"
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              className="datetime-input"
            />
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
          {visibleQuestions.length < form.questions.length && (
            <div className="questions-indicator">
              <span className="visible-count">Preguntas visibles: {visibleQuestions.length}</span>
              <span className="hidden-count">Ocultas: {form.questions.length - visibleQuestions.length}</span>
            </div>
          )}
          {form.questions.map((question, index) => {
            const visibleIndex = visibleQuestions.indexOf(question.id);
            const questionNumber = visibleIndex >= 0 ? visibleIndex + 1 : null;
            return renderQuestion(question, questionNumber || index + 1, index);
          })}
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