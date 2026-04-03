import React from 'react';
import { Award, ChevronRight } from 'lucide-react';

const RankingItem = ({ pos, name, pts, medalColor }) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-white/5 rounded-xl hover:bg-slate-800/40 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full ${medalColor} flex items-center justify-center font-bold text-[10px] shadow-lg`}>
        {pos}
      </div>
      <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{name?.toUpperCase()}</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end leading-none">
        <span className="text-xs font-mono font-black text-primary">{pts || 0}</span>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">GREENS</span>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-all shadow-[0_0_8px_#22c55e66]"></div>
    </div>
  </div>
);

const RankingTeaser = ({ top3 = [] }) => {
  const medalColors = [
    'bg-yellow-500 text-slate-900 shadow-yellow-500/20',
    'bg-slate-300 text-slate-900 shadow-slate-300/20',
    'bg-amber-600 text-slate-900 shadow-amber-600/20',
  ];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-primary" />
          <h2 className="text-sm font-black font-display tracking-widest text-white/90 uppercase">TOP 3 RANKING</h2>
        </div>
        <button className="text-[10px] font-bold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors group">
          VER TUDO <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-2">
        {top3.length > 0 ? (
          top3.map((player, index) => (
            <RankingItem 
              key={player.nome} 
              pos={index + 1} 
              name={player.nome} 
              pts={player.total_greens} 
              medalColor={medalColors[index]} 
            />
          ))
        ) : (
          <div className="p-8 text-center glass-card border-dashed">
            <p className="text-slate-500 text-xs font-medium">Ainda sem dados de ranking.</p>
          </div>
        )}
      </div>
      
      <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-slate-700 text-[10px] font-black text-slate-500 hover:border-primary/40 hover:text-primary transition-all uppercase tracking-widest">
        Ver Classificação Completa e Estatísticas
      </button>
    </section>
  );
};

export default RankingTeaser;
