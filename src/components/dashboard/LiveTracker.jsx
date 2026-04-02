import React from 'react';
import { Target, AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react';

const TrackerSegment = ({ status, playerName }) => {
  const statusStyles = {
    pending: 'bg-slate-700/50 border-white/5',
    running: 'bg-yellow-500/20 border-yellow-500/40 animate-pulse',
    won: 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_8px_#10b98144]',
    lost: 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_8px_#f43f5e44]',
  };

  const Icon = {
    pending: Target,
    running: PlayCircle,
    won: CheckCircle2,
    lost: AlertCircle,
  }[status];

  const iconColor = {
    pending: 'text-slate-600',
    running: 'text-yellow-500',
    won: 'text-emerald-500',
    lost: 'text-rose-500',
  }[status];

  return (
    <div 
      className={`relative h-12 flex-1 rounded-lg border flex items-center justify-center transition-all ${statusStyles[status]} group cursor-pointer hover:scale-[1.02] active:scale-95`}
      title={playerName}
    >
      <Icon size={18} className={iconColor} />
      {/* Tooltip on hover */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity border border-white/10">
        {playerName}
      </div>
    </div>
  );
};

const LeagueTrackerCard = ({ league, segments }) => {
  const isLost = segments.some(s => s.status === 'lost');
  const isWon = segments.every(s => s.status === 'won');

  return (
    <div className={`p-5 glass-card mb-4 relative overflow-hidden transition-all duration-700 ${
      isLost ? 'opacity-60 grayscale-[0.8] border-rose-500/20' : 
      isWon ? 'border-primary/40 shadow-[0_0_30px_#22c55e22]' : 'border-white/5'
    }`}>
      {/* Status Badge */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-black text-sm tracking-widest text-slate-400">
          LIGA <span className={isLost ? 'text-rose-500' : 'text-white'}>{league.toUpperCase()}</span>
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isLost ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' : 
          isWon ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-slate-800 border-white/5 text-slate-400'
        }`}>
          {isLost ? 'MÚLTIPLA PERDIDA 🔴' : isWon ? 'MÚLTIPLA VIVA 🟢' : 'EM JOGO 🟡'}
        </span>
      </div>

      <div className="flex gap-1.5 h-12">
        {segments.map((seg, i) => (
          <TrackerSegment key={i} {...seg} />
        ))}
      </div>
      
      {/* Survivor logic overlay if lost */}
      {isLost && (
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none"></div>
      )}
    </div>
  );
};

const LiveTracker = () => {
  const mockNorte = [
    { status: 'won', playerName: 'CINTRA' },
    { status: 'won', playerName: 'VILAO' },
    { status: 'running', playerName: 'GOMES' },
    { status: 'pending', playerName: 'RAFAEL' },
    { status: 'pending', playerName: 'HUGO' },
    { status: 'pending', playerName: 'TIAGO' },
  ];

  const mockSul = [
    { status: 'won', playerName: 'Duarte' },
    { status: 'lost', playerName: 'Ricardo' },
    { status: 'pending', playerName: 'Pedro' },
    { status: 'pending', playerName: 'Joao' },
    { status: 'pending', playerName: 'Miguel' },
    { status: 'pending', playerName: 'Andre' },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full"></div>
        <h2 className="text-sm font-black font-display tracking-widest text-white/90">BARRAS DE VIDA (LIVE)</h2>
      </div>
      <LeagueTrackerCard league="Norte" segments={mockNorte} />
      <LeagueTrackerCard league="Sul" segments={mockSul} />
    </section>
  );
};

export default LiveTracker;
