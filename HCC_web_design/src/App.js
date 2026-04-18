// Gerekli kütüphaneleri ve oluşturduğumuz sayfaları import ediyoruz
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Bu satırları değiştirin
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import InputPage from './components/InputPage'; 
import TahminSonuc from './components/TahminSonuc';
import LLMRaporu from "./components/LLMRaporu";

import './App.css'; // Genel stil dosyanız

function App() {
  return (
    // Router, tüm uygulamanın sayfa yönlendirmelerini yönetir
    <Router>
      <div className="App">
        {/* Routes, farklı yollar (path) arasında geçiş yapmamızı sağlar */}
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/sonuc" element={<TahminSonuc />} />
          <Route path="/llmrapor" element={<LLMRaporu />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;