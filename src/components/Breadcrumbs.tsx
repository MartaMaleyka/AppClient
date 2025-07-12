import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Inicio', path: '/', icon: '🏠' }
    ];

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Mapear segmentos a nombres legibles
      let label = segment;
      let icon = '';
      
      switch (segment) {
        case 'create':
          label = 'Crear Formulario';
          icon = '➕';
          break;
        case 'form':
          label = 'Formulario';
          icon = '📝';
          break;
        case 'responses':
          label = 'Respuestas';
          icon = '📊';
          break;
        case 'templates':
          label = 'Plantillas';
          icon = '📋';
          break;
        case 'versions':
          label = 'Versiones';
          icon = '🔄';
          break;
        case 'notifications':
          label = 'Notificaciones';
          icon = '🔔';
          break;
        case 'analytics':
          label = 'Analytics';
          icon = '📈';
          break;
        case 'audit-logs':
          label = 'Logs de Auditoría';
          icon = '📋';
          break;
        case 'validations':
          label = 'Validaciones';
          icon = '✅';
          break;
        case 'files':
          label = 'Archivos';
          icon = '📁';
          break;
        default:
          // Si es un ID numérico, no agregar al breadcrumb
          if (/^\d+$/.test(segment)) {
            return;
          }
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
          icon = '📄';
      }
      
      breadcrumbs.push({
        label,
        path: currentPath,
        icon
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumbs">
      <div className="breadcrumbs-container">
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="breadcrumb-item current">
                {breadcrumb.icon} {breadcrumb.label}
              </span>
            ) : (
              <Link to={breadcrumb.path} className="breadcrumb-item">
                {breadcrumb.icon} {breadcrumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs; 