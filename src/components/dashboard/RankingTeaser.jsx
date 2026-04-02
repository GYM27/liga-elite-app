import React from 'react';
import { Award, ChevronRight } from 'lucide-react';

const RankingItem = ({ pos, name, pts, medalColor }) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-white/5 rounded-xl hover:bg-slate-800/40 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full ${medalColor} flex items-center justify-center font-bold text-xs shadow-lg`}>
        {pos}
      </div>
      <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{name}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono font-bold text-slate-400">{pts} PTS</span>
      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
    </div>
  </div>
);

const RankingTeaser = () => {
  const top3 = [
    { pos: 1, name: 'CINTRA', pts: 124, medalColor: 'bg-yellow-500 text-slate-900 shadow-yellow-500/20' },
    { pos: 2, name: 'VILAO', pts: 118, medalColor: 'bg-slate-300 text-slate-900 shadow-slate-300/20' },
    { pos: 3, name: 'GOMES', pts: 112, medalColor: 'bg-amber-600 text-slate-900 shadow-amber-600/20' },
  ];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-primary" />
          <h2 className="text-sm font-black font-display tracking-widest text-white/90">TOP 3 RANKING</h2>
        </div>
        <button className="text-[10px] font-bold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors group">
          VER TUDO <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-2">
        {top3.map((player) => (
          <RankingItem key={player.pos} {...player} />
        ))}
      </div>
      
      <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-500 hover:border-primary/40 hover:text-primary transition-all">
        Ver Classificação Completa e Estatísticas
      </button>
    </section>
  );
};

export default RankingTeaser;
