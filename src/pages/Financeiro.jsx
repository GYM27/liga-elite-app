import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { Wallet, PlusCircle, ArrowRightLeft, History, TrendingUp, TrendingDown, DollarSign, Landmark, LayoutGrid, Loader2, Calendar, ShieldCheck, Activity, Check } from 'lucide-react';

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const { nortePalpites, sulPalpites, loading: dashLoading, fetchData, currentWeek } = useDashboardData();
  const [transfers, setTransfers] = useState([]);
  const [mensalidadesTotal, setMensalidadesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState({ valor: '', de: 'BANCO', para: 'CASA' });
  const [saving, setSaving] = useState(false);

  // SALDOS INICIAIS DE ELITE (VINCADOS PELO COMANDANTE)
  const BASE_CASA = 142.30;
  const BASE_BANCO = 271.00;
  const STAKE_PER_TICKET = 5.00;

  const fetchFinanceData = async () => {
    try {
      const { data: tData, error: tError } = await supabase.from('banca_transferencias').select('*').order('data', { ascending: false }).limit(30);
      const { data: mData, error: mError } = await supabase.from('mensalidades').select('valor_pago').eq('pago', true);
      
      if (tError) console.error('Erro Transf:', tError);
      if (mError) console.error('Erro Mensalidades:', mError);

      setTransfers(tData || []);
      const totalM = (mData || []).reduce((acc, m) => acc + (Number(m.valor_pago) || 0), 0);
      setMensalidadesTotal(totalM);
    } catch (err) { 
      console.error('Crash Financeiro:', err);
      setTransfers([]);
      setMensalidadesTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchFinanceData(); }, []);

  // REGRA DE OURO DA CASA (CALCULO DE JOGO)
  const calcPrizes = (palpites) => {
    if (palpites.length === 0) return { stake: 0, win: 0 };
    const oddsV = palpites.filter(p => p.odd && Number(p.odd) > 0);
    const oddG = oddsV.reduce((acc, p) => acc * Number(p.odd), 1);
    const isWon = palpites.every(p => p.resultado_individual === 'GREEN');
    return { stake: STAKE_PER_TICKET, win: isWon ? (oddG * STAKE_PER_TICKET) : 0 };
  };

  const resNorte = calcPrizes(nortePalpites);
  const resSul = calcPrizes(sulPalpites);

  // CALCULOS DE PARTIÇÃO (DINÂMICOS E AUTOMÁTICOS)
  const totalInternalDeBanco = transfers.filter(t => t.origem === 'BANCO').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalInternalParaBanco = transfers.filter(t => t.destino === 'BANCO').reduce((acc, t) => acc + Number(t.valor), 0);
  
  const totalInternalDeCasa = transfers.filter(t => t.origem === 'CASA').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalInternalParaCasa = transfers.filter(t => t.destino === 'CASA').reduce((acc, t) => acc + Number(t.valor), 0);

  // BANCO: Mensalidades + Transf (In) - Transf (Out)
  const saldoBancoReal = BASE_BANCO + mensalidadesTotal + totalInternalParaBanco - totalInternalDeBanco;
  
  // CASA: (Prizes - Stakes) + Transf (In) - Transf (Out)
  // Nota: Aqui podes somar os ganhos e perdas totais de sempre se a base de dados tiver o historial completo.
  // Por agora, usamos a BASE + Sincronia Real-Time da Semana.
  const saldoCasaReal = BASE_CASA + (resNorte.win + resSul.win) - (resNorte.stake + resSul.stake) + totalInternalParaCasa - totalInternalDeCasa;

  const handleTransfer = async () => {
    if (!isAdmin || !transferencia.valor || transferencia.de === transferencia.para) return;
    setSaving(true);
    const val = Number(transferencia.valor);
    try {
      const { error: tError } = await supabase.from('banca_transferencias').insert({
          origem: transferencia.de, destino: transferencia.para, valor: val
      });
      if (tError) throw tError;

      alert('Cofre Atualizado: Transferência Master OK! 🏁💰');
      setTransferencia({ valor: '', de: 'BANCO', para: 'CASA' });
      fetchFinanceData();
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setSaving(false); }
  };

  if (loading || dashLoading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs tracking-[0.2em] italic">Auditando Tesouraria de Elite...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-20 px-4 max-w-lg mx-auto">
      <div className="mb-2">
        <h2 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
           <Wallet className="text-primary" size={40} />
           <span>Tesouraria <span className="text-primary tracking-widest uppercase">Master</span></span>
        </h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1 italic font-display">Semana {currentWeek} de Operações Financeiras</p>
      </div>

      {/* SALDO TOTAL ACUMULADO */}
      <div className="relative group overflow-hidden bg-slate-900 border-2 border-primary/20 rounded-[50px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center transition-all hover:bg-slate-950">
          <p className="text-primary/40 text-[9px] font-black uppercase tracking-[0.4em] mb-4 italic">Capital Total da Liga de Elite</p>
          <div className="flex items-center justify-center gap-4">
             <span className="text-6xl font-display font-black text-white tabular-nums tracking-tighter italic">{(saldoBancoReal + saldoCasaReal).toFixed(2)}</span>
             <span className="text-3xl font-bold text-primary">€</span>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={150} /></div>
      </div>

      {/* PARTIÇÕES AUTOMÁTICAS */}
      <div className="space-y-4">
         {/* CASA DE APOSTAS */}
         <div className="bg-slate-900 border-2 border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/20"><Activity size={28} /></div>
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Casa de Apostas</p>
                     <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{saldoCasaReal.toFixed(2)}€</p>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-1">
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${(resNorte.win + resSul.win) > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                    {(resNorte.win + resSul.win) > 0 ? 'LUCRO SEMANA ✨' : 'EM SOBREVIVÊNCIA'}
                  </span>
               </div>
            </div>
            {/* MINI AUDITORIA CASA */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dashed border-white/5">
                <div>
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Apostas Realizadas</p>
                   <p className="text-xs font-black text-rose-400 italic">-{ (resNorte.stake + resSul.stake).toFixed(2) }€</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Prémios Ganhos</p>
                   <p className="text-xs font-black text-emerald-500 italic">+{ (resNorte.win + resSul.win).toFixed(2) }€</p>
                </div>
            </div>
         </div>

         {/* CONTA BANCÁRIA */}
         <div className="bg-slate-900 border-2 border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 border border-blue-500/20"><Landmark size={28} /></div>
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Conta Bancária</p>
                     <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{saldoBancoReal.toFixed(2)}€</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Reserva Elite</span>
               </div>
            </div>
            {/* AUDITORIA BANCO */}
            <div className="flex justify-between items-center pt-6 border-t border-dashed border-white/5">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest underline decoration-blue-500/20 underline-offset-4">Fundo de Mensalidades Acumulado</p>
                <p className="text-xs font-black text-blue-400 transition-all">+{mensalidadesTotal.toFixed(2)}€</p>
            </div>
         </div>
      </div>

      {/* FORMULÁRIO DE TRANSFERÊNCIA INTERNA (ADMIN ONLY) */}
      {isAdmin && (
         <div className="bg-slate-950/50 border-2 border-primary/10 rounded-[40px] p-10 space-y-8 animate-in slide-in-from-bottom-2 duration-700 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <div className="text-center space-y-1">
               <h3 className="text-white font-black text-lg uppercase tracking-tight italic flex items-center justify-center gap-3">
                  <ArrowRightLeft className="text-primary" size={24} /> Transferência Interna
               </h3>
               <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">Movimentar capital entre partições</p>
            </div>
            
            <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-4">
               <select value={transferencia.de} onChange={e => setTransferencia({...transferencia, de: e.target.value})} className="bg-slate-900 border-2 border-white/5 rounded-2xl h-16 px-4 text-xs font-black text-white outline-none focus:border-primary/30 transition-all">
                  <option value="BANCO">🏦 BANCO</option>
                  <option value="CASA">🎰 CASA</option>
               </select>
               <div className="flex justify-center text-primary/30 animate-pulse"><ArrowRightLeft size={20} /></div>
               <select value={transferencia.para} onChange={e => setTransferencia({...transferencia, para: e.target.value})} className="bg-slate-900 border-2 border-white/5 rounded-2xl h-16 px-4 text-xs font-black text-white outline-none focus:border-primary/30 transition-all">
                  <option value="CASA">🎰 CASA</option>
                  <option value="BANCO">🏦 BANCO</option>
               </select>
            </div>

            <div className="relative h-20">
               <input type="number" placeholder="Montante..." className="w-full h-full bg-slate-900 border-2 border-white/5 rounded-[24px] px-8 text-2xl font-display font-black text-white outline-none focus:border-primary/30 text-center italic transition-all" value={transferencia.valor} onChange={e => setTransferencia({...transferencia, valor: e.target.value})} />
               <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-primary opacity-50">€</span>
            </div>

            <button onClick={handleTransfer} disabled={saving} className="w-full h-16 bg-primary text-slate-950 rounded-[30px] font-black uppercase text-[12px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] hover:shadow-primary/20 transition-all">
               {saving ? <Loader2 className="animate-spin" /> : <>EXECUTAR TRANSFERÊNCIA <Check size={18} /></>}
            </button>
         </div>
      )}

      {/* HISTÓRICO DE TESOURARIA */}
      <div className="space-y-6">
         <div className="flex justify-between items-center px-4">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
               <History size={18} className="text-primary" /> Histórico de Auditoria
            </h3>
            <span className="text-[10px] font-bold text-slate-600 uppercase">Últimos 30 dias</span>
         </div>
         <div className="space-y-4">
            {transfers.map((t) => (
               <div key={t.id} className="group bg-slate-900 border-2 border-white/5 rounded-[32px] p-6 flex items-center justify-between hover:bg-slate-950 transition-all">
                  <div className="flex items-center gap-5">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                        <ArrowRightLeft size={18} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">{t.origem}</p>
                           <ArrowRightLeft size={10} className="text-primary opacity-30" />
                           <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">{t.destino}</p>
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 flex items-center gap-2">
                           <Calendar size={10} /> {new Date(t.data).toLocaleDateString('pt-PT')} <span className="opacity-30">•</span> {new Date(t.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-display font-black text-white tabular-nums italic tracking-tighter">{Number(t.valor).toFixed(2)}€</p>
                  </div>
               </div>
            ))}
            {transfers.length === 0 && (
               <div className="p-16 text-center border-4 border-dashed border-white/5 rounded-[50px]">
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest italic">Cofre Sem Movimentações Recentes.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Financeiro;
