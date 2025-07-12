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

  return (
    <div className="App">
      <Navigation />
      {isAuthenticated && <Breadcrumbs />}
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          
          {/* Rutas principales */}
          <Route path="/" element={
            <ProtectedRoute>
              <FormList />
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          } />
          <Route path="/form/:id" element={<FormView />} />
          <Route path="/form/:id/responses" element={
            <ProtectedRoute>
              <FormResponses />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para plantillas */}
          <Route path="/templates" element={
            <ProtectedRoute>
              <TemplateManager />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para versionado */}
          <Route path="/form/:formId/versions" element={
            <ProtectedRoute>
              <VersionManagerWrapper />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para notificaciones */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para analytics */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/analytics/form/:formId" element={
            <ProtectedRoute>
              <AnalyticsDashboardWrapper />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para auditoría */}
          <Route path="/audit-logs" element={
            <ProtectedRoute>
              <AuditLogViewer />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para validaciones */}
          <Route path="/validations" element={
            <ProtectedRoute>
              <ValidationBuilder />
            </ProtectedRoute>
          } />
          
          {/* Nuevas rutas para archivos */}
          <Route path="/files" element={
            <ProtectedRoute>
              <FileManager />
            </ProtectedRoute>
          } />
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