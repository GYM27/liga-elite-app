import React from 'react';
import { Home, PlusSquare, Wallet, PieChart, Lock, Unlock, Users, ScrollText, Trophy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminModal from './AdminModal';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, setShowAdminModal } = useAdmin();

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Trophy, label: 'Ligas', path: '/classificacao' },
    { icon: ScrollText, label: 'Bilhetes', path: '/bilhetes' },
    { icon: PlusSquare, label: 'Palpites', path: '/novo-palpite' },
    { icon: Users, label: 'Membros', path: '/membros' },
    { icon: Wallet, label: 'Banca', path: '/financeiro' },
  ];

  return (
    <div className="min-h-screen pb-24">
      <AdminModal />
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-xl font-display font-bold tracking-tight">
          LIGA DE <span className="text-primary italic">ELITE</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-xs font-semibold text-primary">LIVE</span>
          </div>
          <button 
            onClick={() => setShowAdminModal(true)}
            className={`p-2 rounded-full border transition-colors ${isAdmin ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
          >
            {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 max-w-md mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card py-3 px-6 flex justify-between items-center z-50">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={index} 
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-primary' : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
