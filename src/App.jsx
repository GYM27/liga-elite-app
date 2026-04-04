import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import Layout from './components/Layout';

// Páginas
import Dashboard from './pages/Dashboard';
import Classificacao from './pages/Classificacao';
import Bilhetes from './pages/Bilhetes';
import Palpites from './pages/Palpites';
import Financeiro from './pages/Financeiro';
import Estatisticas from './pages/Estatisticas';
import Membros from './pages/Membros';
import Configuracoes from './pages/Configuracoes';

import './index.css';

function App() {
  return (
    <AdminProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classificacao" element={<Classificacao />} />
            <Route path="/bilhetes" element={<Bilhetes />} />
            <Route path="/novo-palpite" element={<Palpites />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            <Route path="/membros" element={<Membros />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </Layout>
      </Router>
    </AdminProvider>
  );
}

export default App;
