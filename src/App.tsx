import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FormBuilder from './components/FormBuilder.tsx';
import FormList from './components/FormList.tsx';
import FormView from './components/FormView.tsx';
import FormResponses from './components/FormResponses.tsx';
import Navigation from './components/Navigation.tsx';
import Login from './components/Login.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';

function AppContent() {
  const { login } = useAuth();

  return (
    <div className="App">
      <Navigation />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
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