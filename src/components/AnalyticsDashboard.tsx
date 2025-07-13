import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

interface AnalyticsData {
  total_forms: number;
  total_responses: number;
  total_views: number;
  avg_completion_rate: number;
  recent_responses: number;
  forms_created: number;
  responses_today: number;
  views_today: number;
}

interface ResponseData {
  id: number;
  form_title: string;
  respondent_name: string;
  submitted_at: string;
  status: 'completed' | 'pending' | 'abandoned';
  completion_time?: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

interface AnalyticsDashboardProps {
  formId?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ formId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentResponses, setRecentResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<string>(formId ? formId.toString() : 'all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchForms();
  }, [selectedForm, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        form_id: selectedForm,
        date_range: dateRange
      });
      
      const response = await fetch(`http://localhost:5000/api/analytics/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics);
        setRecentResponses(data.recent_responses);
      } else {
        console.error('Error fetching analytics');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams({
        form_id: selectedForm,
        date_range: dateRange,
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5000/api/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedForm}-${dateRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al exportar datos');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar datos');
    }
  };

  const handleGenerateReport = async (reportData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          form_id: selectedForm,
          date_range: dateRange,
          ...reportData
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-report-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('¡Reporte generado exitosamente!');
      } else {
        alert('Error al generar reporte');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'abandoned': return '#dc3545';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="empty-analytics">
        <h3>No hay datos de analytics disponibles</h3>
        <p>Comienza a crear formularios y recopilar respuestas para ver datos de analytics.</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Panel de Analytics</h2>
        <button className="export-btn" onClick={handleExportData}>
          Exportar Datos
        </button>
      </div>

      <div className="analytics-filters">
        <div className="filter-group">
          <label>Formulario</label>
          <select 
            value={selectedForm} 
            onChange={(e) => setSelectedForm(e.target.value)}
          >
            <option value="all">Todos los Formularios</option>
            {forms.map(form => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Rango de Fechas</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1d">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total de Formularios</div>
          <div className="stat-value">{formatNumber(analyticsData.total_forms)}</div>
          <div className="stat-change positive">+{analyticsData.forms_created} en este período</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total de Respuestas</div>
          <div className="stat-value">{formatNumber(analyticsData.total_responses)}</div>
          <div className="stat-change positive">+{analyticsData.responses_today} hoy</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total de Vistas</div>
          <div className="stat-value">{formatNumber(analyticsData.total_views)}</div>
          <div className="stat-change positive">+{analyticsData.views_today} hoy</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tasa de Completado</div>
          <div className="stat-value">{formatPercentage(analyticsData.avg_completion_rate)}</div>
          <div className="stat-change positive">+{analyticsData.recent_responses} recientes</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Tendencias de Respuestas</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#667eea' }}></div>
                <span>Respuestas</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#764ba2' }}></div>
                <span>Vistas</span>
              </div>
            </div>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            La visualización del gráfico se implementaría aquí con una biblioteca de gráficos como Chart.js
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Estado de Respuestas</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            La visualización del gráfico circular se implementaría aquí
          </div>
        </div>
      </div>

      <div className="responses-table">
        <div className="table-header">
          <h3 className="table-title">Respuestas Recientes</h3>
        </div>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Formulario</th>
                <th>Respondente</th>
                <th>Estado</th>
                <th>Enviado</th>
                <th>Tiempo de Completado</th>
              </tr>
            </thead>
            <tbody>
              {recentResponses.map(response => (
                <tr key={response.id}>
                  <td>{response.form_title}</td>
                  <td>{response.respondent_name}</td>
                  <td>
                    <span className={`response-status status-${response.status}`}>
                      {response.status === 'completed' ? 'Completado' : 
                       response.status === 'pending' ? 'Pendiente' : 
                       response.status === 'abandoned' ? 'Abandonado' : response.status}
                    </span>
                  </td>
                  <td>{formatDate(response.submitted_at)}</td>
                  <td>
                    {response.completion_time 
                      ? `${Math.round(response.completion_time / 60)} min`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="report-builder">
        <div className="report-header">
          <h3 className="report-title">Constructor de Reportes Personalizados</h3>
        </div>
        <div className="report-form">
          <div className="form-group">
            <label>Tipo de Reporte</label>
            <select id="reportType">
              <option value="summary">Reporte Resumen</option>
              <option value="detailed">Reporte Detallado</option>
              <option value="comparison">Reporte de Comparación</option>
            </select>
          </div>

          <div className="form-group">
            <label>Incluir Gráficos</label>
            <select id="includeCharts">
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Incluir Datos Crudos</label>
            <select id="includeRawData">
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Formato</label>
            <select id="format">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <button 
          className="generate-report-btn"
          onClick={() => handleGenerateReport({
            report_type: (document.getElementById('reportType') as HTMLSelectElement)?.value,
            include_charts: (document.getElementById('includeCharts') as HTMLSelectElement)?.value === 'true',
            include_raw_data: (document.getElementById('includeRawData') as HTMLSelectElement)?.value === 'true',
            format: (document.getElementById('format') as HTMLSelectElement)?.value
          })}
        >
          Generar Reporte
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 