import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, PlayCircle, Shield, X, Info } from 'lucide-react';

const TrackerSegment = ({ status, playerName, pPhoto, gameData, onClick }) => {
  const borderStyles = {
    pending: 'border-slate-800 opacity-30 grayscale',
    running: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse',
    won: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    lost: 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  };

  const bgStyles = {
    pending: 'bg-slate-900',
    running: 'bg-yellow-500/10',
    won: 'bg-emerald-500/10',
    lost: 'bg-rose-500/10',
  };

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div 
        onClick={() => playerName && onClick(gameData)}
        className={`relative w-11 h-11 md:w-14 md:h-14 rounded-2xl border-2 transition-all duration-500 cursor-pointer active:scale-90 ${borderStyles[status || 'pending']} ${bgStyles[status || 'pending']} overflow-hidden p-0.5 group`}
      >
        <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-900 flex items-center justify-center relative">
          {pPhoto ? (
            <img src={pPhoto} className="w-full h-full object-cover" alt={playerName} />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-xs italic uppercase">
                {playerName ? playerName.substring(0,2) : '?'}
             </div>
          )}
          {/* Badge de Status no Canto */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-tl-lg border-l border-t border-white/10 ${
            status === 'won' ? 'bg-emerald-500' : 
            status === 'lost' ? 'bg-rose-500' : 
            status === 'running' ? 'bg-yellow-500' : 'bg-slate-800'
          }`}></div>
        </div>
      </div>
      
      <span className={`text-[8px] font-black uppercase tracking-tighter truncate w-full text-center ${
        status === 'lost' ? 'text-rose-500' : 
        status === 'won' ? 'text-emerald-500' : 
        status === 'running' ? 'text-yellow-500' : 'text-slate-500'
      }`}>
        {playerName?.split(' ')[0] || '...'}
      </span>
    </div>
  );
};

const LeagueTrackerCard = ({ league, palpites = [], onSelect }) => {
  const segments = Array(6).fill(null).map((_, i) => {
    const palpite = palpites[i];
    if (!palpite) return { status: 'pending', playerName: null, pPhoto: null };
    
    const result = palpite.resultado_individual?.toUpperCase();
    let status = 'running';
    if (result === 'GREEN') status = 'won';
    if (result === 'RED') status = 'lost';
    
    const playerObj = palpite.jogadores;
    const name = Array.isArray(playerObj) ? playerObj[0]?.nome : playerObj?.nome;
    const photo = Array.isArray(playerObj) ? playerObj[0]?.foto_url : playerObj?.foto_url;

    return { 
      status, 
      playerName: name || 'Sócio',
      pPhoto: photo,
      gameData: { ...palpite, league }
    };
  });

  const isLost = segments.some(s => s.status === 'lost');
  const isWon = segments.every(s => s.status === 'won' && s.playerName);

  return (
    <div className={`p-6 glass-card mb-6 relative transition-all duration-700 rounded-[32px] border-2 ${
      isLost ? 'bg-rose-500/5 border-rose-500/10' : 
      isWon ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_30px_#22c55e11]' : 'border-white/5'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
           <Shield size={14} className={isLost ? 'text-rose-500' : isWon ? 'text-emerald-500' : 'text-primary'} />
           <h3 className="font-display font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase">
             LIGA <span className={isLost ? 'text-rose-500' : 'text-white'}>{league.toUpperCase()}</span>
           </h3>
        </div>
        <span className={`text-[8px] font-black px-2 py-1 rounded-lg border tracking-widest uppercase ${
          isLost ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' : 
          isWon ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-slate-800 border-white/5 text-slate-400'
        }`}>
          {isLost ? 'PERDIDA 🔴' : isWon ? 'GANHA 🟢' : 'SOBREVIVÊNCIA 🟡'}
        </span>
      </div>

      <div className="flex gap-2 justify-between">
        {segments.map((seg, i) => (
          <TrackerSegment key={i} {...seg} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
};

const LiveTracker = ({ norteSegments = [], sulSegments = [], currentWeek = '??' }) => {
  const [selectedBet, setSelectedBet] = useState(null);

  return (
    <section className="mb-10 relative">
      <div className="flex items-center gap-3 mb-5 px-2">
        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_#22c55e]"></div>
        <h2 className="text-xs font-black font-display tracking-[0.3em] text-white/90 uppercase italic">Estado Real da Semana {currentWeek}</h2>
      </div>

      <LeagueTrackerCard league="Norte" palpites={norteSegments} onSelect={setSelectedBet} />
      <LeagueTrackerCard league="Sul" palpites={sulSegments} onSelect={setSelectedBet} />

      {/* BALÃO DE ELITE (MODAL INFO DINÂMICO) */}
      {selectedBet && (() => {
        const result = selectedBet.resultado_individual?.toUpperCase();
        const status = result === 'GREEN' ? 'won' : result === 'RED' ? 'lost' : 'running';
        
        const modalStyles = {
          won: 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.2)]',
          lost: 'border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.2)]',
          running: 'border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.2)]',
        }[status];

        const textStyles = {
          won: 'text-emerald-500',
          lost: 'text-rose-500',
          running: 'text-yellow-500',
        }[status];

        return (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedBet(null)}
          >
            <div 
              className={`w-full max-w-sm bg-slate-900 border-2 rounded-[40px] p-8 relative animate-in zoom-in-95 duration-300 ${modalStyles}`}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedBet(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                 <div className={`w-20 h-20 rounded-3xl overflow-hidden border-2 mb-4 shadow-xl ${modalStyles.split(' ')[0]}`}>
                    {selectedBet.jogadores?.foto_url ? (
                      <img src={selectedBet.jogadores.foto_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-primary font-black text-2xl italic uppercase">
                         {selectedBet.jogadores?.nome?.substring(0,2) || '??'}
                      </div>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Análise de</p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                       status === 'won' ? 'bg-emerald-500 text-white' : 
                       status === 'lost' ? 'bg-rose-500 text-white' : 'bg-yellow-500 text-slate-950'
                    }`}>{status === 'won' ? 'GANHA' : status === 'lost' ? 'PERDIDA' : 'EM JOGO'}</span>
                 </div>
                 <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter mb-6 underline decoration-white/10">{selectedBet.jogadores?.nome}</h3>

                 <div className="w-full space-y-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Jogo Escolhido</p>
                       <p className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                          {selectedBet.equipa_casa} <span className="opacity-20 text-xs">VS</span> {selectedBet.equipa_fora}
                       </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Aposta</p>
                          <p className={`text-xs font-black uppercase italic ${textStyles}`}>{selectedBet.aposta}</p>
                       </div>
                       <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Odd de Elite</p>
                          <p className="text-sm font-black text-white tabular-nums">{Number(selectedBet.odd || 1.0).toFixed(2)}</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 w-full">
                    <button 
                      onClick={() => setSelectedBet(null)}
                      className={`w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all ${
                        status === 'won' ? 'bg-emerald-500 text-white' : 
                        status === 'lost' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      Fechar Detalhes
                    </button>
                 </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

export default LiveTracker;
