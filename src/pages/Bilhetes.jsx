import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Ticket, TrendingUp, DollarSign, Calendar, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

const BetSlip = ({ league, palpites = [] }) => {
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

  const StatusBadge = () => {
    if (status === 'WON') return <div className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><CheckCircle2 size={10} /> GANHO</div>;
    if (status === 'LOST') return <div className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><XCircle size={10} /> PERDIDO</div>;
    return <div className="flex items-center gap-1 bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><Clock size={10} /> EM JOGO</div>;
  };

  return (
    <div className="relative group flex flex-col h-full min-h-[580px]">
      <div className={`flex-1 border-2 rounded-[40px] overflow-hidden transition-all duration-500 flex flex-col ${statusStyles[status]}`}>
        
        {/* Header do Bilhete */}
        <div className={`${status === 'WON' ? 'bg-emerald-600' : status === 'LOST' ? 'bg-rose-600' : 'bg-slate-900'} text-white p-6 text-center relative transition-colors`}>
          <div className="flex justify-between items-center mb-1">
             <span className="text-[9px] font-black bg-black/20 px-2 py-0.5 rounded uppercase tracking-widest">Elite Ticket</span>
             <StatusBadge />
          </div>
          <h3 className="font-display font-black text-2xl tracking-tighter italic uppercase flex items-center justify-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> LIGA {league.toUpperCase()}
          </h3>
        </div>

        {/* Detalhes Técnicos */}
        <div className="px-6 py-2 border-b border-dashed border-slate-300/50 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1"><Calendar size={10} /> S{palpites[0]?.semana || '??'}</div>
          <div>REF: {league.substring(0,1)}-{Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>

        {/* Conteúdo do Bilhete (Jogos) */}
        <div className="flex-1 p-6 space-y-4">
          {palpites.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 italic text-xs uppercase font-black tracking-widest opacity-30">Vazio</div>
          ) : (
            palpites.map((p, i) => (
              <div key={i} className={`flex justify-between items-center border-b pb-3 last:border-0 ${status === 'PENDING' ? 'border-slate-100' : 'border-black/5'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-black text-slate-300">#{i + 1}</span>
                    <p className={`text-[11px] font-black uppercase leading-tight ${p.resultado_individual === 'RED' ? 'text-rose-400 line-through' : 'text-slate-800'}`}>
                      {p.equipa_casa} <span className="opacity-30 mx-0.5">VS</span> {p.equipa_fora}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter italic">{p.aposta || 'TBA'}</p>
                    {p.resultado_individual === 'GREEN' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-[11px] font-black tabular-nums bg-slate-100 px-2 py-1 rounded-lg border border-black/5">
                    {Number(p.odd || 1.0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Financeiro (Compacto & Alinhado) */}
        <div className={`p-6 space-y-2.5 ${status === 'PENDING' ? 'bg-slate-50' : 'bg-black/5'}`}>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Odd Total</span>
            <span className="tabular-nums">{oddGlobal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Stake</span>
            <span className="tabular-nums">{STAKE.toFixed(2)}€</span>
          </div>
          <div className="pt-3 border-t-2 border-slate-300/20 space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">PRÉMIO POTENCIAL</p>
            <div className="flex items-baseline justify-end gap-1.5 min-h-[40px]">
              <span className="text-4xl font-display font-black tabular-nums tracking-tighter leading-none">
                {premioPotencial.toFixed(2)}
              </span>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bilhetes = () => {
  const { nortePalpites, sulPalpites, loading, currentWeek } = useDashboardData();
  const STAKE = 5.0;

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase tracking-widest italic">Imprimindo Bilhetes...</div>;

  const calcPrizes = (palpites) => {
    const oddsV = palpites.filter(p => p.odd && Number(p.odd) > 0);
    const oddG = oddsV.reduce((acc, p) => acc * Number(p.odd), 1);
    const potential = oddG * STAKE;
    const isWon = palpites.length > 0 && palpites.every(p => p.resultado_individual === 'GREEN');
    const isLost = palpites.some(p => p.resultado_individual === 'RED');
    return { potential, earned: isWon ? potential : 0, status: isLost ? 'LOST' : isWon ? 'WON' : 'PENDING' };
  };

  const resNorte = calcPrizes(nortePalpites);
  const resSul = calcPrizes(sulPalpites);
  const potenciaTotal = resNorte.potential + resSul.potential;
  const ganhoAcumulado = resNorte.earned + resSul.earned;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-12 px-2 max-w-screen-xl mx-auto px-4 md:px-8">
      <div className="mb-6 flex justify-between items-end px-2">
        <div>
           <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <Ticket className="text-primary" size={32} />
              <span>Controlo <span className="text-primary tracking-widest uppercase">Bilhetes</span></span>
           </h2>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1 italic font-display">Semana {currentWeek} de Elite</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border-l-4 border-primary p-6 rounded-[32px] shadow-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Apurado Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-black text-white italic tracking-tighter">{potenciaTotal.toFixed(2)}</span>
            <span className="text-sm font-bold text-primary">€</span>
          </div>
        </div>
        <div className={`border-l-4 p-6 rounded-[32px] shadow-2xl transition-all ${ganhoAcumulado > 0 ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900 border-slate-700'}`}>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Realizado na Semana</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-display font-black italic tracking-tighter ${ganhoAcumulado > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>{ganhoAcumulado.toFixed(2)}</span>
            <span className={`text-sm font-bold ${ganhoAcumulado > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>€</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <BetSlip league="Norte" palpites={nortePalpites} />
        <BetSlip league="Sul" palpites={sulPalpites} />
      </div>      
    </div>
  );
};

export default Bilhetes;
