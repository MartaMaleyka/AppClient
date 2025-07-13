import React, { useState, useEffect } from 'react';
import './NotificationCenter.css';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  related_form_id?: number;
  form_title?: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  info_count: number;
  success_count: number;
  warning_count: number;
  error_count: number;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Error fetching notifications');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/stats', {
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

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        fetchStats();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        if (stats) {
          setStats({ ...stats, unread: 0 });
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchStats();
        alert('¡Notificación eliminada exitosamente!');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar todas las notificaciones?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/notifications/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications([]);
        if (stats) {
          setStats({ ...stats, total: 0, unread: 0 });
        }
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    const matchesReadStatus = !showUnreadOnly || !notification.is_read;
    return matchesType && matchesReadStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace un momento';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return '#1976d2';
      case 'success': return '#2e7d32';
      case 'warning': return '#f57c00';
      case 'error': return '#d32f2f';
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
    <div className="notification-center">
      <div className="notification-header">
        <h2>Notificaciones</h2>
        <div className="notification-actions">
          <button className="notification-btn mark-all-read-btn" onClick={handleMarkAllAsRead}>
            Marcar Todo como Leído
          </button>
          <button className="notification-btn clear-all-btn" onClick={handleClearAll}>
            Limpiar Todo
          </button>
        </div>
      </div>

      {stats && (
        <div className="notification-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.unread}</span>
            <span className="stat-label">No Leídas</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.info_count}</span>
            <span className="stat-label">Información</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.success_count}</span>
            <span className="stat-label">Éxito</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.warning_count}</span>
            <span className="stat-label">Advertencia</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.error_count}</span>
            <span className="stat-label">Error</span>
          </div>
        </div>
      )}

      <div className="notification-filters">
        <div className="filter-group">
                        <label>Tipo</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Todos los Tipos</option>
            <option value="info">Información</option>
            <option value="success">Éxito</option>
            <option value="warning">Advertencia</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="filter-group">
                        <label>Estado</label>
          <select 
            value={showUnreadOnly ? 'unread' : 'all'} 
            onChange={(e) => setShowUnreadOnly(e.target.value === 'unread')}
          >
            <option value="all">Todas las Notificaciones</option>
            <option value="unread">Solo No Leídas</option>
          </select>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-notifications">
          <h3>No se encontraron notificaciones</h3>
          <p>
            {selectedType !== 'all' || showUnreadOnly 
              ? 'Intenta ajustar tus filtros para ver más notificaciones.'
              : '¡Estás al día! No hay notificaciones en este momento.'
            }
          </p>
        </div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map(notification => (
            <div key={notification.id} className={`notification-item ${!notification.is_read ? 'unread' : ''}`}>
              <div className="notification-header-info">
                <div>
                  <h4 className="notification-title">{notification.title}</h4>
                  <span className={`notification-type ${notification.type}`}>
                    {notification.type}
                  </span>
                </div>
              </div>

              <p className="notification-message">{notification.message}</p>

              {notification.form_title && (
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                  Relacionado con: <strong>{notification.form_title}</strong>
                </p>
              )}

              <div className="notification-meta">
                <span>{formatDate(notification.created_at)}</span>
                <div className="notification-actions">
                  {!notification.is_read && (
                    <button 
                      className="notification-action-btn mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Marcar como Leído
                    </button>
                  )}
                  <button 
                    className="notification-action-btn delete-notification-btn"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 