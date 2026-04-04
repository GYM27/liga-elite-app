import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Ticket, TrendingUp, DollarSign, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

const BetSlip = ({ league, palpites = [] }) => {
  const STAKE = 5.00;
  
  // Calcular Odd Global (Apenas palpites que tenham odd > 0)
  const oddsValidas = palpites.filter(p => p.odd && Number(p.odd) > 0);
  const oddGlobal = oddsValidas.reduce((acc, p) => acc * Number(p.odd), 1);
  const premioPotencial = oddGlobal * STAKE;

  // Determinar Estado do Bilhete
  const hasRed = palpites.some(p => p.resultado_individual === 'RED');
  const allGreen = palpites.length > 0 && palpites.every(p => p.resultado_individual === 'GREEN');
  const status = hasRed ? 'LOST' : allGreen ? 'WON' : 'PENDING';

  const statusStyles = {
    WON: 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20 text-emerald-900',
    LOST: 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/20 text-rose-900',
    PENDING: 'bg-white border-slate-200 text-slate-900'
  };

  const StatusBadge = () => {
    if (status === 'WON') return <div className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse"><CheckCircle2 size={12} /> GANHO</div>;
    if (status === 'LOST') return <div className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><XCircle size={12} /> PERDIDO</div>;
    return <div className="flex items-center gap-1 bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock size={12} /> EM JOGO</div>;
  };

  return (
    <div className="relative group h-full">
      <div className={`h-full border-2 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col min-h-[520px] ${statusStyles[status]}`}>
        
        {/* Header do Bilhete */}
        <div className={`${status === 'WON' ? 'bg-emerald-600' : status === 'LOST' ? 'bg-rose-600' : 'bg-slate-900'} text-white p-6 text-center relative overflow-hidden transition-colors`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
          <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-black bg-black/20 px-2 py-0.5 rounded uppercase">Elite Ticket</span>
             <StatusBadge />
          </div>
          <h3 className="font-display font-black text-2xl tracking-tighter italic uppercase">
            #LIGA {league.toUpperCase()}
          </h3>
        </div>

        {/* Info Extra */}
        <div className="px-6 py-3 border-b border-dashed border-slate-300/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
          <div className="flex items-center gap-1">
            <Calendar size={12} /> SEMANA {palpites[0]?.semana || '??'}
          </div>
          <div>ID: {league.substring(0,1)}-{Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>

        {/* Lista de Seleções */}
        <div className="flex-1 p-6 space-y-4">
          {palpites.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
              Aguardando palpites...
            </div>
          ) : (
            palpites.map((p, i) => (
              <div key={i} className={`flex justify-between items-start border-b pb-3 last:border-0 ${status === 'PENDING' ? 'border-slate-100' : 'border-black/5'}`}>
                <div className="flex-1 pr-4">
                  {/* Nome do Jogador no Bilhete */}
                  <div className="text-[8px] font-black tracking-widest text-slate-400 uppercase mb-0.5">
                    Palpite de: <span className="text-slate-600 underline decoration-primary/30 decoration-2">{p.jogadores?.nome || 'Anónimo'}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-black opacity-30">#{i + 1}</span>
                    <p className={`text-xs font-black uppercase leading-tight ${p.resultado_individual === 'RED' ? 'text-rose-600 line-through' : 'text-inherit'}`}>
                      {p.equipa_casa || 'Equipa A'} <span className="text-[9px] opacity-40">vs</span> {p.equipa_fora || 'Equipa B'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-4">
                    <p className="text-[10px] font-bold text-primary uppercase">{p.aposta || 'Pendente'}</p>
                    {p.resultado_individual === 'GREEN' && <CheckCircle2 size={10} className="text-emerald-500" />}
                    {p.resultado_individual === 'RED' && <XCircle size={10} className="text-rose-500" />}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end h-full">
                  <span className="text-xs font-display font-black tabular-nums">
                    {Number(p.odd || 1.0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Corte Serrilha Visual */}
        <div className="flex items-center px-2 py-1 bg-black/5">
          {Array(20).fill(0).map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-slate-200/50 rounded-full mx-0.5"></div>
          ))}
        </div>

        {/* Footer com Totais */}
        <div className={`p-6 space-y-3 ${status === 'PENDING' ? 'bg-slate-50' : 'bg-black/5'}`}>
          <div className="flex justify-between items-center text-xs font-bold opacity-60">
            <span>ODD TOTAL</span>
            <span className="font-black tracking-tight tabular-nums">{oddGlobal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold opacity-60">
            <span>STAKE COLETIVA</span>
            <span className="font-black tabular-nums">{STAKE.toFixed(2)}€</span>
          </div>
          <div className="pt-3 border-t-2 border-slate-300/30 flex justify-between items-end">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">PRÉMIO POTENCIAL</span>
            <div className="text-right">
              <span className="text-2xl font-display font-black tabular-nums">
                {premioPotencial.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-primary ml-1">€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bilhetes = () => {
  const { nortePalpites, sulPalpites, loading } = useDashboardData();
  const STAKE = 5.0;

  if (loading) return <div className="text-white text-center mt-20">A carregar bilhetes...</div>;

  // Calculos Globais
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <Ticket className="text-primary" size={32} />
          <span>Controlo <span className="text-primary tracking-widest">Bilhetes</span></span>
        </h2>
      </div>

      {/* NOVO: Dashboard Financeiro da Jornada */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/40 border-l-4 border-primary p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Prémio Potencial Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-black text-white">{potenciaTotal.toFixed(2)}</span>
            <span className="text-sm font-bold text-primary text-emerald-500">€</span>
          </div>
        </div>
        <div className={`border-l-4 p-5 rounded-2xl transition-all ${ganhoAcumulado > 0 ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-800/20 border-slate-700'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ganho Real na Semana</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-display font-black ${ganhoAcumulado > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{ganhoAcumulado.toFixed(2)}</span>
            <span className="text-sm font-bold text-emerald-500">€</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BetSlip league="Norte" palpites={nortePalpites} />
        <BetSlip league="Sul" palpites={sulPalpites} />
      </div>

      <div className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Regras da Múltipla</p>
          <p className="text-slate-500 text-xs">A aposta de 5€ é unitária por liga. Se um jogador falhar o palpite, a múltipla é considerada perdida. Todos os 6 devem acertar para o prémio cair!</p>
        </div>
      </div>
    </div>
  );
};

export default Bilhetes;
