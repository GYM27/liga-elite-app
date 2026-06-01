import React, { useState, useEffect } from 'react';
import { Crown, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { EliteAvatar } from '../ui';

const HighlightCarousel = ({ title, players = [], type = 'best', month }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (players.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % players.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [players, month]);

  const p = players[index];
  if (!p) return (
    <div className="flex-1 bg-slate-900/40 border border-dashed border-white/5 rounded-[40px] p-6 flex items-center justify-center text-slate-700 font-black uppercase text-[10px] tracking-widest italic opacity-20 h-40">
      Nenhum Destaque em {month}
    </div>
  );

  const isBest = type === 'best';
  const hasMultiple = players.length > 1;

  const next = (e) => { e.stopPropagation(); setIndex((index + 1) % players.length); };
  const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + players.length) % players.length); };

  return (
    <div key={month} className={`relative flex-1 rounded-[40px] border p-6 min-h-[160px] flex items-center justify-between transition-all duration-700 animate-in fade-in slide-in-from-right-4 group overflow-hidden ${isBest
        ? 'bg-gradient-to-br from-yellow-500/10 to-amber-900/10 border-yellow-500/30'
        : 'bg-slate-800/10 border-white/5'
      }`}>

      <div className="absolute top-3 left-6">
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic px-4 py-1 rounded-lg border ${isBest ? 'bg-yellow-400 text-slate-950 border-yellow-400 ' : 'bg-slate-900 text-slate-500 border-white/10'
          }`}>
          {title}
        </span>
      </div>

      {hasMultiple && (
        <>
          <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/80 transition-all z-10"><ChevronLeft size={20} /></button>
          <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/80 transition-all z-10"><ChevronRight size={20} /></button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {players.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-primary w-4' : 'bg-white/10'}`}></div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-6">
        <div className="relative group-hover:scale-105 transition-transform duration-500">
          <EliteAvatar 
            src={p.foto_url} 
            name={p.nome} 
            size="lg" 
            className={`rotate-${isBest ? '1' : '-1'} border-2 ${isBest ? 'border-yellow-500/50' : 'border-white/10'}`} 
          />
          {isBest && <Crown size={20} className="absolute -top-2 -left-4 text-yellow-500 drop-shadow-xl rotate-12" />}
        </div>
        <p className="text-[12px] font-black text-white uppercase tracking-tight italic truncate max-w-[100px] text-center">
          {p.nome?.split(' ')[0]}
        </p>
      </div>

      <div className="flex flex-col items-center pr-4">
        <div className="flex items-center gap-1.5 mb-1 opacity-40">
          <Target size={12} className={isBest ? 'text-yellow-500' : 'text-slate-500'} />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Acertos</span>
        </div>
        <p className={`text-4xl font-black italic leading-none ${isBest ? 'text-primary drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-white/40'}`}>
          {p.acertos_mes || 0}
        </p>
      </div>
    </div>
  );
};

export default HighlightCarousel;
