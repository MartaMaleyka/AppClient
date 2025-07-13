import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import './App.css';
import FormBuilder from './components/FormBuilder.tsx';
import FormList from './components/FormList.tsx';
import FormView from './components/FormView.tsx';
import FormResponses from './components/FormResponses.tsx';
import Navigation from './components/Navigation.tsx';
import Breadcrumbs from './components/Breadcrumbs.tsx';
import Login from './components/Login.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import TemplateManager from './components/TemplateManager.tsx';
import VersionManager from './components/VersionManager.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import AuditLogViewer from './components/AuditLogViewer.tsx';
import ValidationBuilder from './components/ValidationBuilder.tsx';
import FileManager from './components/FileManager.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';

// Componente wrapper para VersionManager con parámetros
const VersionManagerWrapper: React.FC = () => {
  const { formId } = useParams();
  return <VersionManager formId={parseInt(formId || '0')} />;
};

// Componente wrapper para AnalyticsDashboard con parámetros
const AnalyticsDashboardWrapper: React.FC = () => {
  const { formId } = useParams();
  return <AnalyticsDashboard formId={parseInt(formId || '0')} />;
};

function AppContent() {
  const { login, isAuthenticated } = useAuth();

  // Si no está autenticado, mostrar solo el login
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Routes>
          <Route path="*" element={<Login onLogin={login} />} />
        </Routes>
      </div>
    );
  }

  // Si está autenticado, mostrar la aplicación completa
  return (
    <div className="App">
      <Navigation />
      <Breadcrumbs />
      <main className="container">
        <Routes>
          {/* Rutas principales */}
          <Route path="/" element={<FormList />} />
          <Route path="/create" element={<FormBuilder />} />
          <Route path="/form/:id" element={<FormView />} />
          <Route path="/form/:id/responses" element={<FormResponses />} />
          
          {/* Nuevas rutas para plantillas */}
          <Route path="/templates" element={<TemplateManager />} />
          
          {/* Nuevas rutas para versionado */}
          <Route path="/form/:formId/versions" element={<VersionManagerWrapper />} />
          
          {/* Nuevas rutas para notificaciones */}
          <Route path="/notifications" element={<NotificationCenter />} />
          
          {/* Nuevas rutas para analytics */}
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/analytics/form/:formId" element={<AnalyticsDashboardWrapper />} />
          
          {/* Nuevas rutas para auditoría */}
          <Route path="/audit-logs" element={<AuditLogViewer />} />
          
          {/* Nuevas rutas para validaciones */}
          <Route path="/validations" element={<ValidationBuilder />} />
          
          {/* Nuevas rutas para archivos */}
          <Route path="/files" element={<FileManager />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 