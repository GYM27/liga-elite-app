import React from 'react';
import { Home, PlusSquare, CreditCard, PieChart, History, Settings } from 'lucide-react';

const Layout = ({ children }) => {
  const navItems = [
    { icon: Home, label: 'Início', active: true },
    { icon: PlusSquare, label: 'Palpite' },
    { icon: CreditCard, label: 'Pagos' },
    { icon: PieChart, label: 'Stats' },
    { icon: Settings, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-xl font-display font-bold tracking-tight">
          LIGA DE <span className="text-primary italic">ELITE</span>
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-xs font-semibold text-primary">LIVE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 max-w-md mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card py-3 px-6 flex justify-between items-center z-50">
        {navItems.map((item, index) => (
          <button 
            key={index} 
            className={`flex flex-col items-center gap-1 transition-all ${
              item.active ? 'text-primary' : 'text-slate-400 opacity-60 hover:opacity-100'
            }`}
          >
            <item.icon size={20} strokeWidth={item.active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
