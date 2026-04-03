import React from 'react';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass, highlight }) => (
  <div className={`p-4 glass-card border-none flex flex-col justify-between h-full bg-slate-800/40 min-h-[140px] transition-all hover:bg-slate-800/60 group`}>
    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-display font-black tracking-tight ${highlight ? 'text-primary drop-shadow-[0_0_10px_#22c55e66]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  </div>
);

const FinanceGrid = ({ stats }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full shadow-[0_0_8px_#22c55e]"></div>
        <h2 className="text-sm font-black font-display tracking-widest text-white/90">CENTRO FINANCEIRO</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3 h-full">
        {/* Saldo - 2 rows span */}
        <div className="row-span-2">
          <StatCard 
            icon={Wallet} 
            label="SALDO DA BANCA" 
            value={`${stats?.saldo?.toFixed(2) || '0.00'}€`} 
            colorClass="bg-primary/20 text-primary"
            highlight
          />
        </div>
        
        {/* ROI and Potential Gain */}
        <div className="col-start-2">
          <StatCard 
            icon={TrendingUp} 
            label="ROI ÉPOCA" 
            value={`+${stats?.roi || '0'}%`} 
            colorClass="bg-secondary/20 text-secondary"
          />
        </div>
        <div className="col-start-2">
          <StatCard 
            icon={DollarSign} 
            label="GANHO POTENCIAL" 
            value={`${stats?.ganhoPotencial?.toFixed(2) || '0.00'}€`} 
            colorClass="bg-yellow-500/20 text-yellow-500"
          />
        </div>
      </div>
    </section>
  );
};

export default FinanceGrid;
