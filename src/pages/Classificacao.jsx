import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Trophy, Medal, Target, Crown, Calendar, ChevronDown, Award, Frown, History, ChevronLeft, ChevronRight } from 'lucide-react';

const HighlightCarousel = ({ title, players = [], type = 'best', month }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0); // Reiniciar index ao mudar de mês
    if (players.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % players.length);
    }, 4500); // Mais tempo para leitura já que é interativo
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
    <div key={month} className={`relative flex-1 rounded-[40px] border p-6 min-h-[160px] flex items-center justify-between transition-all duration-700 animate-in fade-in slide-in-from-right-4 group overflow-hidden ${
      isBest 
      ? 'bg-gradient-to-br from-yellow-500/10 to-amber-900/10 border-yellow-500/30' 
      : 'bg-slate-800/10 border-white/5'
    }`}>
      
      {/* HEADER TITLE PILL */}
      <div className="absolute top-3 left-6">
         <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic px-4 py-1 rounded-lg border ${
           isBest ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-slate-900 text-slate-500 border-white/10'
         }`}>
            {title}
         </span>
      </div>

      {/* NAVIGATION CONTROLS (Only if multiple) */}
      {hasMultiple && (
        <>
          <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/80 transition-all z-10 index-20"><ChevronLeft size={20} /></button>
          <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/80 transition-all z-10 index-20"><ChevronRight size={20} /></button>
          
          {/* DOTS COUNTER */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {players.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-primary w-4' : 'bg-white/10'}`}
              ></div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col items-center gap-2 pt-6">
         <div className="relative group-hover:scale-105 transition-transform duration-500">
            <div className={`w-16 h-16 rounded-[24px] overflow-hidden border-2 bg-slate-900 shadow-2xl transition-all ${
               isBest ? 'border-yellow-500/50 rotate-1' : 'border-white/10 -rotate-1'
            }`}>
               {p.foto_url ? (
                 <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-black text-xs uppercase italic text-slate-700">{p.nome?.substring(0,2)}</div>
               )}
            </div>
            {isBest && <Crown size={20} className="absolute -top-4 -right-4 text-yellow-500 drop-shadow-xl rotate-12" />}
         </div>
         <p className="text-[12px] font-display font-black text-white uppercase tracking-tight italic truncate max-w-[100px] text-center">
            {p.nome?.split(' ')[0]}
         </p>
      </div>

      <div className="flex flex-col items-center pr-4">
         <div className="flex items-center gap-1.5 mb-1 opacity-40">
            <Target size={12} className={isBest ? 'text-yellow-500' : 'text-slate-500'} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-display">Acertos</span>
         </div>
         <p className={`text-4xl font-display font-black italic leading-none ${isBest ? 'text-primary drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-white/40'}`}>
            {p.acertos_mes || 0}
         </p>
      </div>
      
    </div>
  );
};

const HallOfFameModal = ({ isOpen, onClose, hallOfFame }) => {
  if (!isOpen || !hallOfFame) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in" onClick={onClose}></div>
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-[48px] overflow-hidden flex flex-col relative z-20 shadow-3xl animate-in zoom-in-95 duration-200 text-white">
         
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
            <div>
               <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Hall of Fame 🏛️</h3>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Estatísticas Acumuladas da Época</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">✕</button>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <Award className="text-yellow-500" size={24} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Reis da Época</h4>
               </div>
               <div className="grid grid-cols-1 gap-4 text-white">
                  {hallOfFame.winners.slice(0, 6).map((w, i) => (
                    <div key={i} className="bg-slate-800/40 border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <span className="text-lg font-black text-yellow-500 italic">#{i+1}</span>
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/10 bg-slate-900">
                             {w.foto_url && <img src={w.foto_url} className="w-full h-full object-cover" />}
                          </div>
                          <p className="font-black uppercase tracking-tight italic text-white">{w.nome}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-display font-black text-primary">{w.wins} <span className="text-[10px]">🏆</span></p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-6 opacity-80 decoration-rose-500/20">
               <div className="flex items-center gap-3">
                  <Frown className="text-rose-500" size={24} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Hall of Shame</h4>
               </div>
               <div className="grid grid-cols-1 gap-4 text-white">
                  {hallOfFame.losers.slice(0, 6).map((l, i) => (
                    <div key={i} className="bg-slate-800/20 border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                       <div className="flex items-center gap-4 pl-2">
                          <span className="text-sm font-black text-rose-500/50 mr-2">#{i+1}</span>
                          <div className="w-10 h-10 rounded-xl overflow-hidden grayscale bg-slate-900 border border-white/5">
                             {l.foto_url && <img src={l.foto_url} className="w-full h-full object-cover opacity-60" />}
                          </div>
                          <p className="font-black uppercase tracking-tight italic text-slate-400">{l.nome}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-display font-black text-rose-500/80">{l.loses} <span className="text-[10px]">🏮</span></p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
         
         <div className="p-6 bg-slate-950/50 text-center border-t border-white/5">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">Consolidado Elite Bet © Época 24/25</p>
         </div>
      </div>
    </div>
  );
};

const Classificacao = () => {
  const { ranking, allMonthlyRankings, hallOfFame, months, currentMonth, idsNorte, idsSul, loading } = useDashboardData();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);

  useEffect(() => {
    if (currentMonth && !selectedMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth, selectedMonth]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-white font-black animate-pulse text-xs">Aguardando História Geral...</div>;

  const rankingNorte = (ranking || []).filter(p => idsNorte.includes(p.jogador_id));
  const rankingSul = (ranking || []).filter(p => idsSul.includes(p.jogador_id));

  // Rankings do Mês Selecionado
  const currentMonthlyRank = allMonthlyRankings[selectedMonth] || [];
  const topAcertosMes = currentMonthlyRank.length > 0 ? currentMonthlyRank[0].acertos_mes : 0;
  const melhoresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === topAcertosMes && topAcertosMes > 0);

  const bottomAcertosMes = currentMonthlyRank.length > 0 ? currentMonthlyRank[currentMonthlyRank.length - 1].acertos_mes : -1;
  const pioresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === bottomAcertosMes && bottomAcertosMes !== -1);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20 pt-4 px-1">
      
      {/* TIME SELECTOR DROPDOWN REAL */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/10 border border-white/5 p-5 rounded-[32px] relative z-20">
         <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg border border-primary/20">
               <Calendar size={24} />
            </div>
            <div className="relative">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-40">Período de Referência</p>
               <button 
                 onClick={() => setShowDropdown(!showDropdown)}
                 className="flex items-center gap-2 group transition-all"
               >
                  <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tight group-hover:text-primary">{selectedMonth || 'Carregando...'}</h3>
                  <ChevronDown size={18} className={`text-primary transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
               </button>

               {/* ACTUAL DROPDOWN LIST - ABSOLUTE & FLOATING */}
               {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-4 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[90]">
                      <div className="py-2">
                        {months.map(m => (
                           <button
                             key={m}
                             onClick={() => { setSelectedMonth(m); setShowDropdown(false); }}
                             className={`w-full px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest italic transition-all hover:bg-white/5 border-b border-white/5 last:border-0 ${
                               selectedMonth === m ? 'text-primary bg-primary/5' : 'text-slate-400 font-bold'
                             }`}
                           >
                             {m}
                           </button>
                        ))}
                      </div>
                    </div>
                  </>
               )}
            </div>
         </div>

         <button onClick={() => setShowHallOfFame(true)} className="bg-slate-950/80 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-3 transition-all hover:bg-primary/10 hover:border-primary/40 group">
            <History size={20} className="text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black text-white uppercase tracking-widest italic tracking-tighter">Hall of Fame</span>
         </button>
      </div>

      {/* HIGHLIGHTS SYNCED WITH SELECTED MONTH */}
      <div className="flex flex-col sm:flex-row gap-4">
         <HighlightCarousel title="MELHOR DO MÊS 🥇" players={melhoresDoMes} type="best" month={selectedMonth} />
         <HighlightCarousel title="PIOR DO MÊS 🏮" players={pioresDoMes} type="worst" month={selectedMonth} />
      </div>

      <div className="grid grid-cols-1 gap-14 pt-4 border-t border-white/5">
        <section className="space-y-6">
           <div className="flex items-end justify-between px-3 border-b border-white/5 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tight italic text-blue-400">Liga Norte</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acertos Totais</span>
           </div>
           <div className="space-y-3">
              {rankingNorte.map((p, i) => (
                <div key={i} className="bg-slate-800/10 border border-white/5 rounded-[24px] p-4 flex items-center justify-between h-20 group hover:bg-slate-800/20 transition-all">
                   <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-slate-950' : 'bg-slate-900 text-slate-500'}`}>{i + 1}</div>
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                         {p.foto_url && <img src={p.foto_url} className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-display font-black text-white uppercase italic group-hover:text-primary transition-colors">{p.nome}</p>
                   </div>
                   <p className="text-xl font-black text-primary italic pr-2">{p.total_greens || 0}</p>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-end justify-between px-3 border-b border-white/5 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tight italic text-orange-400">Liga Sul</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acertos Totais</span>
           </div>
           <div className="space-y-3">
              {rankingSul.map((p, i) => (
                <div key={i} className="bg-slate-800/10 border border-white/5 rounded-[24px] p-4 flex items-center justify-between h-20 group hover:bg-slate-800/20 transition-all">
                   <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-slate-900 text-slate-500">{i + 7}</div>
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                         {p.foto_url && <img src={p.foto_url} className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-display font-black text-white uppercase italic group-hover:text-primary transition-colors">{p.nome}</p>
                   </div>
                   <p className="text-xl font-black text-primary italic pr-2">{p.total_greens || 0}</p>
                </div>
              ))}
           </div>
        </section>
      </div>

      <HallOfFameModal isOpen={showHallOfFame} onClose={() => setShowHallOfFame(false)} hallOfFame={hallOfFame} />
    </div>
  );
};

export default Classificacao;
