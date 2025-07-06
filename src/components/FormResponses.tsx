import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './FormResponses.css';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options?: string[];
}

interface Answer {
  question_id: number;
  question_text: string;
  question_type: string;
  answer_text: string;
}

interface Response {
  id: number;
  respondent_name: string;
  submitted_at: string;
  answers: Answer[];
}

interface Form {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

const FormResponses: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`http://localhost:5000/api/forms/${id}`);
      if (!formResponse.ok) {
        throw new Error('Formulario no encontrado');
      }
      const formData = await formResponse.json();
      setForm(formData);

      // Fetch responses
      const responsesResponse = await fetch(`http://localhost:5000/api/forms/${id}/responses`);
      if (!responsesResponse.ok) {
        throw new Error('Error al cargar respuestas');
      }
      const responsesData = await responsesResponse.json();
      setResponses(responsesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
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

  const getAnswerForQuestion = (response: Response, questionId: number) => {
    const answer = response.answers.find(a => a.question_id === questionId);
    return answer ? answer.answer_text : 'Sin respuesta';
  };

  if (loading) {
    return (
      <div className="responses-container">
        <div className="loading">Cargando respuestas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="responses-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="back-btn">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="responses-container">
        <div className="error">Formulario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="responses-container">
      <div className="responses-header">
        <div className="header-content">
          <h1>Respuestas: {form.title}</h1>
          {form.description && (
            <p className="form-description">{form.description}</p>
          )}
          <div className="response-stats">
            <span className="stat">
              📊 {responses.length} respuesta{responses.length !== 1 ? 's' : ''}
            </span>
            <span className="stat">
              ❓ {form.questions.length} pregunta{form.questions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Link to="/" className="back-btn">← Volver</Link>
      </div>

      {responses.length === 0 ? (
        <div className="empty-responses">
          <div className="empty-icon">📝</div>
          <h2>No hay respuestas aún</h2>
          <p>Comparte el enlace del formulario para empezar a recibir respuestas</p>
          <div className="form-link">
            <strong>Enlace del formulario:</strong>
            <code>{window.location.origin}/form/{form.id}</code>
          </div>
        </div>
      ) : (
        <div className="responses-content">
          <div className="responses-table">
            <div className="table-header">
              <div className="header-cell respondent">Respondente</div>
              <div className="header-cell date">Fecha</div>
              {form.questions.map((question, index) => (
                <div key={question.id} className="header-cell question">
                  P{index + 1}. {question.question_text}
                </div>
              ))}
            </div>

            <div className="table-body">
              {responses.map((response) => (
                <div key={response.id} className="table-row">
                  <div className="cell respondent">
                    {response.respondent_name || 'Anónimo'}
                  </div>
                  <div className="cell date">
                    {formatDate(response.submitted_at)}
                  </div>
                  {form.questions.map((question) => (
                    <div key={question.id} className="cell answer">
                      <div className="answer-content">
                        {getAnswerForQuestion(response, question.id)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="responses-summary">
            <h3>Resumen de Respuestas</h3>
            <div className="summary-grid">
              {form.questions.map((question, index) => {
                const questionResponses = responses.map(r => 
                  getAnswerForQuestion(r, question.id)
                ).filter(answer => answer !== 'Sin respuesta');
                
                return (
                  <div key={question.id} className="summary-item">
                    <h4>P{index + 1}. {question.question_text}</h4>
                    <p className="response-count">
                      {questionResponses.length} respuesta{questionResponses.length !== 1 ? 's' : ''}
                    </p>
                    {question.question_type === 'radio' || question.question_type === 'select' ? (
                      <div className="option-stats">
                        {question.options?.map((option: string) => {
                          const count = questionResponses.filter(answer => 
                            answer.includes(option)
                          ).length;
                          const percentage = questionResponses.length > 0 
                            ? Math.round((count / questionResponses.length) * 100) 
                            : 0;
                          
                          return (
                            <div key={option} className="option-stat">
                              <span className="option-name">{option}</span>
                              <div className="option-bar">
                                <div 
                                  className="option-fill" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="option-count">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-answers">
                        {questionResponses.slice(0, 3).map((answer, idx) => (
                          <div key={idx} className="text-answer">
                            "{answer.length > 50 ? answer.substring(0, 50) + '...' : answer}"
                          </div>
                        ))}
                        {questionResponses.length > 3 && (
                          <div className="more-answers">
                            +{questionResponses.length - 3} más...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses; 