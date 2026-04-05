import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAdmin } from '../context/AdminContext';
import { Ticket, Calendar, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

const BetSlip = ({ league, palpites = [], isAdmin, onToggleStatus }) => {
  const STAKE = 5.00;
  
  // Calcular Odd Global
  const oddsValidas = palpites.filter(p => p.odd && Number(p.odd) > 0);
  const oddGlobal = oddsValidas.reduce((acc, p) => acc * Number(p.odd), 1);
  const premioPotencial = oddGlobal * STAKE;

  // Determinar Estado do Bilhete
  const hasRed = palpites.some(p => p.resultado_individual === 'RED');
  const allGreen = palpites.length > 0 && palpites.every(p => p.resultado_individual === 'GREEN');
  const status = hasRed ? 'LOST' : allGreen ? 'WON' : 'PENDING';

  const statusStyles = {
    WON: 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-[0_0_40px_rgba(16,185,129,0.1)]',
    LOST: 'bg-rose-50 border-rose-200 text-rose-900 opacity-80',
    PENDING: 'bg-white border-slate-200 text-slate-900 shadow-xl'
  };

  return (
    <div className="relative group flex flex-col h-full min-h-[580px]">
      <div className={`flex-1 border-2 rounded-[40px] overflow-hidden transition-all duration-500 flex flex-col ${statusStyles[status]}`}>
        
        {/* Header do Bilhete */}
        <div className={`${status === 'WON' ? 'bg-emerald-600' : status === 'LOST' ? 'bg-rose-600' : 'bg-slate-900'} text-white pt-11 pb-6 px-6 text-center relative transition-colors`}>
          <div className="absolute top-4 right-6">
             <div className="flex items-center gap-1 bg-white/10 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
               {status === 'WON' ? <CheckCircle2 size={10} /> : status === 'LOST' ? <XCircle size={10} /> : <Clock size={10} />}
               {status === 'WON' ? 'GANHO' : status === 'LOST' ? 'PERDIDO' : 'EM JOGO'}
             </div>
          </div>
          <h3 className="font-display font-black text-2xl tracking-tighter italic uppercase flex items-center justify-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> LIGA {league.toUpperCase()}
          </h3>
        </div>

        <div className="flex-1 p-6 space-y-4">
          {palpites.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 italic text-xs uppercase font-black tracking-widest opacity-30">Sem Palpites nesta Semana</div>
          ) : (
            palpites.map((p, i) => (
              <div 
                key={i} 
                onClick={() => isAdmin && onToggleStatus(p.id, p.resultado_individual)}
                className={`flex justify-between items-center border-b pb-3 last:border-0 cursor-default ${isAdmin ? 'hover:bg-black/5 cursor-pointer rounded-lg px-2 -mx-2' : ''} ${status === 'PENDING' ? 'border-slate-100' : 'border-black/5'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-black text-slate-400">#{i + 1}</span>
                    <p className={`text-[11px] font-black uppercase leading-tight ${p.resultado_individual === 'RED' ? 'text-rose-400 line-through' : 'text-slate-800'}`}>
                      {p.equipa_casa} <span className="opacity-30 mx-0.5">VS</span> {p.equipa_fora}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                      {p.aposta || 'TBA'} 
                      <span className={`ml-1.5 not-italic border-l border-black/10 pl-1.5 ${p.resultado_individual === 'RED' ? 'text-rose-500 font-extrabold line-through' : p.resultado_individual === 'GREEN' ? 'text-emerald-600' : 'text-primary'}`}>
                        — {p.jogadores?.nome || 'Sócio'}
                      </span>
                    </p>
                    {p.resultado_individual === 'GREEN' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>}
                    {p.resultado_individual === 'RED' && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-[11px] font-black tabular-nums bg-white/50 border rounded-lg px-2 py-1">
                    {Number(p.odd || 1.0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`p-6 space-y-2.5 ${status === 'PENDING' ? 'bg-slate-50' : 'bg-black/5'}`}>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Odd Total</span>
            <span className="tabular-nums">{oddGlobal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Stake</span>
            <span className="tabular-nums">5.00€</span>
          </div>
          <div className="pt-3 border-t border-slate-300/30 space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">PRÉMIO POTENCIAL</p>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-4xl font-display font-black tabular-nums tracking-tighter">
                {premioPotencial.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-400">€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bilhetes = () => {
  const { fullHistory, currentWeek, availableWeeks, loading, updatePalpiteResult } = useDashboardData();
  const { isAdmin } = useAdmin();
  const [selectedWeek, setSelectedWeek] = React.useState(null);

  React.useEffect(() => {
    if (currentWeek && !selectedWeek) setSelectedWeek(currentWeek);
  }, [currentWeek]);

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase tracking-widest italic font-display">Sintonizando Linha Temporal...</div>;

  const weekToView = selectedWeek || currentWeek;
  const weeklyPalpites = (fullHistory || []).filter(p => Number(p.semana) === Number(weekToView));
  
  const nortePalpites = weeklyPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'norte');
  const sulPalpites = weeklyPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'sul');

  const handleToggle = async (id, currentResult) => {
    if (!isAdmin) return;
    const nextStatusMap = {
       null: 'GREEN',
       'GREEN': 'RED',
       'RED': null
    };
    const next = nextStatusMap[currentResult === undefined ? null : currentResult];
    await updatePalpiteResult(id, next);
  };

  const calcPrizes = (palpites) => {
    const oddsV = palpites.filter(p => p.odd && Number(p.odd) > 0);
    const oddG = oddsV.reduce((acc, p) => acc * Number(p.odd), 1);
    const potential = oddG * 5.0;
    const isWon = palpites.length > 0 && palpites.every(p => p.resultado_individual === 'GREEN');
    return { potential, earned: isWon ? potential : 0 };
  };

  const resNorte = calcPrizes(nortePalpites);
  const resSul = calcPrizes(sulPalpites);
  const ganhoAcumulado = resNorte.earned + resSul.earned;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12 pb-20 px-4 max-w-4xl mx-auto">
      {/* SELETOR DROPDOWN DE ELITE */}
      <div className="mt-10 flex flex-col items-center">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 italic">Linha Temporal de Elite</label>
        <div className="relative group w-full max-w-xs">
          <select 
            value={selectedWeek || currentWeek} 
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="w-full h-16 bg-slate-900 border-2 border-white/5 rounded-[24px] px-8 text-sm font-black text-white appearance-none outline-none focus:border-primary/40 transition-all cursor-pointer shadow-2xl uppercase tracking-widest text-center italic"
          >
            {(availableWeeks || []).map(w => (
              <option key={w} value={w} className="bg-slate-900 text-white font-black py-2">
                Semana {w} {w === currentWeek ? ' (ATUAL) 🔥' : ''}
              </option>
            ))}
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-30 group-hover:opacity-100 transition-opacity">
             <Calendar size={18} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end px-2 pt-6">
        <div>
           <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <Ticket className="text-primary" size={28} />
              <span>Arquivo <span className="text-primary tracking-widest uppercase">Bilhetes</span></span>
           </h2>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1 italic font-display">Semana {weekToView} de Registos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border-l-4 border-primary/40 p-6 rounded-[32px]">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Prémio Potencial</p>
          <p className="text-3xl font-display font-black text-white italic tracking-tighter">{(resNorte.potential + resSul.potential).toFixed(2)}€</p>
        </div>
        <div className={`border-l-4 p-6 rounded-[32px] transition-all duration-700 ${ganhoAcumulado > 0 ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900 border-slate-700'}`}>
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Ganho Realizado</p>
          <p className={`text-3xl font-display font-black italic tracking-tighter ${ganhoAcumulado > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>{ganhoAcumulado.toFixed(2)}€</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <BetSlip league="Norte" palpites={nortePalpites} isAdmin={isAdmin} onToggleStatus={handleToggle} />
        <BetSlip league="Sul" palpites={sulPalpites} isAdmin={isAdmin} onToggleStatus={handleToggle} />
      </div>      
    </div>
  );
};

export default Bilhetes;
