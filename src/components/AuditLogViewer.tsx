import React, { useState, useEffect } from 'react';
import './AuditLogViewer.css';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export';
  entity_type: string;
  entity_id?: number;
  details: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditStats {
  total_logs: number;
  today_logs: number;
  critical_logs: number;
  high_severity_logs: number;
  medium_severity_logs: number;
  low_severity_logs: number;
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<number[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedAction, selectedSeverity, selectedUser, dateFrom, dateTo, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action_type: selectedAction,
        severity_level: selectedSeverity,
        user_id: selectedUser,
        date_from: dateFrom,
        date_to: dateTo,
        page: currentPage.toString(),
        limit: '20'
      });
      
      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.total_pages);
      } else {
        console.error('Error fetching audit logs');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams({
        action_type: selectedAction,
        severity_level: selectedSeverity,
        user_id: selectedUser,
        date_from: dateFrom,
        date_to: dateTo,
        format: 'csv'
      });
      
      const response = await fetch(`/api/audit-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Audit logs exported successfully!');
      } else {
        alert('Error exporting audit logs');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error exporting audit logs');
    }
  };

  const handleViewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const handleToggleDetails = (logId: number) => {
    setExpandedDetails(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return '#2e7d32';
      case 'update': return '#f57c00';
      case 'delete': return '#d32f2f';
      case 'login': return '#1976d2';
      case 'logout': return '#7b1fa2';
      case 'export': return '#00695c';
      default: return '#666';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#2e7d32';
      case 'medium': return '#f57c00';
      case 'high': return '#d32f2f';
      case 'critical': return '#c2185b';
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

  return (
    <div className="audit-log-viewer">
      <div className="audit-header">
        <h2>Audit Log Viewer</h2>
        <button className="export-logs-btn" onClick={handleExportLogs}>
          Export Logs
        </button>
      </div>

      {stats && (
        <div className="audit-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total_logs}</span>
            <span className="stat-label">Total Logs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.today_logs}</span>
            <span className="stat-label">Today</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.critical_logs}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.high_severity_logs}</span>
            <span className="stat-label">High</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.medium_severity_logs}</span>
            <span className="stat-label">Medium</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.low_severity_logs}</span>
            <span className="stat-label">Low</span>
          </div>
        </div>
      )}

      <div className="audit-filters">
        <div className="filter-group">
          <label>Action Type</label>
          <select 
            value={selectedAction} 
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export">Export</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Severity Level</label>
          <select 
            value={selectedSeverity} 
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="filter-group">
          <label>User</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="1">User 1</option>
            <option value="2">User 2</option>
            {/* This would be populated with actual users */}
          </select>
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-logs">
          <h3>No audit logs found</h3>
          <p>Try adjusting your filters to see more logs.</p>
        </div>
      ) : (
        <div className="audit-table">
          <div className="table-header">
            <h3 className="table-title">Audit Logs</h3>
          </div>
          <div className="table-container">
            <table className="audit-table-content">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Severity</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.username}</td>
                    <td>
                      <span className={`action-type action-${log.action_type}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td>{log.entity_type}</td>
                    <td>
                      <span className={`severity-level severity-${log.severity_level}`}>
                        {log.severity_level}
                      </span>
                    </td>
                    <td>
                      <div className={`log-details ${expandedDetails.includes(log.id) ? 'expanded' : ''}`}>
                        {log.details}
                        <button 
                          className="expand-details-btn"
                          onClick={() => handleToggleDetails(log.id)}
                        >
                          {expandedDetails.includes(log.id) ? 'Show less' : 'Show more'}
                        </button>
                      </div>
                    </td>
                    <td>{log.ip_address}</td>
                    <td>
                      <div>{formatDate(log.created_at)}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatRelativeTime(log.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showLogModal && selectedLog && (
        <div className="log-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Details</h3>
              <button className="close-btn" onClick={() => setShowLogModal(false)}>
                ×
              </button>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">User</div>
              <div className="log-detail-value">{selectedLog.username}</div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">Action</div>
              <div className="log-detail-value">
                <span className={`action-type action-${selectedLog.action_type}`}>
                  {selectedLog.action_type}
                </span>
              </div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">Entity Type</div>
              <div className="log-detail-value">{selectedLog.entity_type}</div>
            </div>
            
            {selectedLog.entity_id && (
              <div className="log-detail-item">
                <div className="log-detail-label">Entity ID</div>
                <div className="log-detail-value">{selectedLog.entity_id}</div>
              </div>
            )}
            
            <div className="log-detail-item">
              <div className="log-detail-label">Severity</div>
              <div className="log-detail-value">
                <span className={`severity-level severity-${selectedLog.severity_level}`}>
                  {selectedLog.severity_level}
                </span>
              </div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">Details</div>
              <div className="log-detail-value">{selectedLog.details}</div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">IP Address</div>
              <div className="log-detail-value">{selectedLog.ip_address}</div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">User Agent</div>
              <div className="log-detail-value">{selectedLog.user_agent}</div>
            </div>
            
            <div className="log-detail-item">
              <div className="log-detail-label">Timestamp</div>
              <div className="log-detail-value">{formatDate(selectedLog.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer; 