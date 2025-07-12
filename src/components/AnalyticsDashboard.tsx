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
      
      const response = await fetch(`/api/analytics/dashboard?${params}`, {
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
      const response = await fetch('/api/forms', {
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
      
      const response = await fetch(`/api/analytics/export?${params}`, {
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
        alert('Error exporting data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const handleGenerateReport = async (reportData: any) => {
    try {
      const response = await fetch('/api/analytics/reports', {
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
        alert('Report generated successfully!');
      } else {
        alert('Error generating report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
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
        <h3>No analytics data available</h3>
        <p>Start creating forms and collecting responses to see analytics data.</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <button className="export-btn" onClick={handleExportData}>
          Export Data
        </button>
      </div>

      <div className="analytics-filters">
        <div className="filter-group">
          <label>Form</label>
          <select 
            value={selectedForm} 
            onChange={(e) => setSelectedForm(e.target.value)}
          >
            <option value="all">All Forms</option>
            {forms.map(form => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Forms</div>
          <div className="stat-value">{formatNumber(analyticsData.total_forms)}</div>
          <div className="stat-change positive">+{analyticsData.forms_created} this period</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Responses</div>
          <div className="stat-value">{formatNumber(analyticsData.total_responses)}</div>
          <div className="stat-change positive">+{analyticsData.responses_today} today</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Views</div>
          <div className="stat-value">{formatNumber(analyticsData.total_views)}</div>
          <div className="stat-change positive">+{analyticsData.views_today} today</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value">{formatPercentage(analyticsData.avg_completion_rate)}</div>
          <div className="stat-change positive">+{analyticsData.recent_responses} recent</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Response Trends</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#667eea' }}></div>
                <span>Responses</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#764ba2' }}></div>
                <span>Views</span>
              </div>
            </div>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Chart visualization would be implemented here with a charting library like Chart.js
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Response Status</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Pie chart visualization would be implemented here
          </div>
        </div>
      </div>

      <div className="responses-table">
        <div className="table-header">
          <h3 className="table-title">Recent Responses</h3>
        </div>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Respondent</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Completion Time</th>
              </tr>
            </thead>
            <tbody>
              {recentResponses.map(response => (
                <tr key={response.id}>
                  <td>{response.form_title}</td>
                  <td>{response.respondent_name}</td>
                  <td>
                    <span className={`response-status status-${response.status}`}>
                      {response.status}
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
          <h3 className="report-title">Custom Report Builder</h3>
        </div>
        <div className="report-form">
          <div className="form-group">
            <label>Report Type</label>
            <select id="reportType">
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="comparison">Comparison Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Include Charts</label>
            <select id="includeCharts">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Include Raw Data</label>
            <select id="includeRawData">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Format</label>
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
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 