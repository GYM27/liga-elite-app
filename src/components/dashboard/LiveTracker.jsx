import React from 'react';
import { Target, AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react';

const TrackerSegment = ({ status, playerName }) => {
  const statusStyles = {
    pending: 'bg-slate-700/30 border-white/5 opacity-40',
    running: 'bg-yellow-500/20 border-yellow-500/40 animate-pulse',
    won: 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_8px_#10b98144]',
    lost: 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_8px_#f43f5e44]',
  };

  const Icon = {
    pending: Target,
    running: PlayCircle,
    won: CheckCircle2,
    lost: AlertCircle,
  }[status || 'pending'];

  const iconColor = {
    pending: 'text-slate-600',
    running: 'text-yellow-500',
    won: 'text-emerald-500',
    lost: 'text-rose-500',
  }[status || 'pending'];

  return (
    <div 
      className={`relative h-12 flex-1 rounded-lg border flex items-center justify-center transition-all ${statusStyles[status || 'pending']} group cursor-pointer hover:scale-[1.02] active:scale-95`}
    >
      <Icon size={18} className={iconColor} />
      {playerName && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200 border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform group-hover:-translate-y-1">
          {playerName}
        </div>
      )}
    </div>
  );
};

const LeagueTrackerCard = ({ league, palpites = [] }) => {
  // Garantir sempre 6 segmentos
  const segments = Array(6).fill(null).map((_, i) => {
    const palpite = palpites[i];
    if (!palpite) return { status: 'pending', playerName: null };
    
    const result = palpite.resultado_individual?.toUpperCase();
    let status = 'running';
    if (result === 'GREEN') status = 'won';
    if (result === 'RED') status = 'lost';
    
    return { 
      status, 
      playerName: palpite.jogadores?.nome 
    };
  });

  const isLost = segments.some(s => s.status === 'lost');
  const isWon = segments.every(s => s.status === 'won' && s.playerName);

  return (
    <div className={`p-5 glass-card mb-4 relative transition-all duration-700 ${
      isLost ? 'opacity-50 grayscale-[0.5] border-rose-500/20' : 
      isWon ? 'border-primary shadow-[0_0_30px_#22c55e33]' : 'border-white/5'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-black text-xs tracking-widest text-slate-400">
          LIGA <span className={isLost ? 'text-rose-500' : 'text-white'}>{league.toUpperCase()}</span>
        </h3>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
          isLost ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' : 
          isWon ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-slate-800 border-white/5 text-slate-400'
        }`}>
          {isLost ? 'MÚLTIPLA PERDIDA 🔴' : isWon ? 'MÚLTIPLA VENCIDA 🟢' : 'EM SOBREVIVÊNCIA 🟡'}
        </span>
      </div>

      <div className="flex gap-1.5 h-12">
        {segments.map((seg, i) => (
          <TrackerSegment key={i} {...seg} />
        ))}
      </div>
    </div>
  );
};

const LiveTracker = ({ norteSegments = [], sulSegments = [] }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_10px_#22c55e]"></div>
        <h2 className="text-sm font-black font-display tracking-widest text-white/90">BARRAS DE VIDA (LIVE)</h2>
      </div>
      <LeagueTrackerCard league="Norte" palpites={norteSegments} />
      <LeagueTrackerCard league="Sul" palpites={sulSegments} />
    </section>
  );
};

export default LiveTracker;
