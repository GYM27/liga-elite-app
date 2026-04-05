import React from 'react';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, colorClass, highlight, isBig, to }) => {
  const CardContent = (
    <div className={`p-5 glass-card border-none flex flex-col justify-between bg-slate-800/60 shadow-xl transition-all hover:bg-slate-800/80 group ${isBig ? 'h-full min-h-[160px]' : 'min-h-[120px]'} ${to ? 'cursor-pointer hover:ring-1 hover:ring-primary/30' : ''}`}>
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className={`font-display font-black tracking-tighter ${highlight ? 'text-primary text-4xl' : 'text-white text-2xl'}`}>
          {value}
        </p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{CardContent}</Link>;
  }

  return CardContent;
};

const FinanceGrid = ({ stats }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_10px_#22c55e]"></div>
        <h2 className="text-sm font-black font-display tracking-widest text-white/90 uppercase italic">Finanças da Elite</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Saldo - Link para Financeiro */}
        <div className="col-span-1 md:col-span-2">
          <StatCard 
            icon={Wallet} 
            label="CAIXA TOTAL (ESTADO ATUAL)" 
            value={`${Number(stats?.saldo || 0).toFixed(2)}€`} 
            colorClass="bg-emerald-500 text-slate-900 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            highlight
            isBig
            to="/stats"
          />
        </div>
        
        {/* Prémio Semana */}
        <div className="col-span-1 md:col-span-2">
          <StatCard 
            icon={DollarSign} 
            label="PRÉMIO SEMANA" 
            value={`${Number(stats?.ganhoPotencial || 0).toFixed(2)}€`} 
            colorClass="bg-primary/20 text-primary border border-primary/20"
            isBig
          />
        </div>
      </div>
    </section>
  );
};

export default FinanceGrid;
