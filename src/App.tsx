import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FormBuilder from './components/FormBuilder.tsx';
import FormList from './components/FormList.tsx';
import FormView from './components/FormView.tsx';
import FormResponses from './components/FormResponses.tsx';
import Navigation from './components/Navigation.tsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="container">
          <Routes>
            <Route path="/" element={<FormList />} />
            <Route path="/create" element={<FormBuilder />} />
            <Route path="/form/:id" element={<FormView />} />
            <Route path="/form/:id/responses" element={<FormResponses />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 