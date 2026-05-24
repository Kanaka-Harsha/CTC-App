import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadEvidence from './pages/UploadEvidence';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Toaster position="top-right" />
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<UploadEvidence />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
