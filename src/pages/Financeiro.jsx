import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { Wallet, PlusCircle, ArrowRightLeft, History, TrendingUp, TrendingDown, DollarSign, Landmark, LayoutGrid, Loader2, Calendar } from 'lucide-react';

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const { stats, loading: dashLoading, fetchData, currentWeek } = useDashboardData();
  const [particao, setParticao] = useState({ casa_valor: 0, banco_valor: 0 });
  const [transfers, setTransfers] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState({ valor: '', de: 'BANCO', para: 'CASA' });
  const [saving, setSaving] = useState(false);

  const fetchFinanceData = async () => {
    try {
      const [{ data: pData }, { data: tData }, { data: lData }] = await Promise.all([
        supabase.from('banca_particoes').select('*').single(),
        supabase.from('banca_transferencias').select('*').order('data', { ascending: false }).limit(20),
        supabase.from('banca_transacoes').select('*').order('criado_em', { ascending: false }).limit(20)
      ]);
      if (pData) setParticao(pData);
      setTransfers(tData || []);
      setLedger(lData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFinanceData(); }, []);

  const handleTransfer = async () => {
    if (!isAdmin || !transferencia.valor || transferencia.de === transferencia.para) return;
    setSaving(true);
    const val = Number(transferencia.valor);
    try {
      const update = transferencia.de === 'BANCO' 
        ? { banco_valor: particao.banco_valor - val, casa_valor: particao.casa_valor + val }
        : { casa_valor: particao.casa_valor - val, banco_valor: particao.banco_valor + val };

      const { error: pError } = await supabase.from('banca_particoes').update(update).eq('id', 1);
      if (pError) throw pError;

      const { error: tError } = await supabase.from('banca_transferencias').insert({
          origem: transferencia.de, destino: transferencia.para, valor: val
      });
      if (tError) throw tError;

      alert('Transferência Interna Concluída! 🔄💰');
      setTransferencia({ valor: '', de: 'BANCO', para: 'CASA' });
      fetchFinanceData();
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setSaving(false); }
  };

  if (loading || dashLoading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase tracking-widest italic tracking-tight">Sincronizando Tesouraria...</div>;

  const bancaTotalReal = Number(stats.saldo || 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-12 px-2 max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
           <Wallet className="text-primary" size={32} />
           <span>Banca <span className="text-primary tracking-widest uppercase text-xl">Master</span></span>
        </h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1 italic font-display">Controlo de Tesouraria Global</p>
      </div>

      {/* SALDO TOTAL (LEI DA BANCA) */}
      <div className="relative overflow-hidden bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 shadow-[0_0_50px_rgba(34,197,94,0.15)] text-center">
         <p className="text-primary/50 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Capital Total da Elite</p>
         <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-display font-black text-white tabular-nums tracking-tighter">{bancaTotalReal.toFixed(2)}</span>
            <span className="text-3xl font-bold text-primary">€</span>
         </div>
         <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={80} /></div>
      </div>

      {/* PARTIÇÕES (CASA VS BANCO) */}
      <div className="grid grid-cols-1 gap-4">
         <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 flex items-center justify-between shadow-2xl group hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400"><LayoutGrid size={24} /></div>
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Casa Apostas</p>
                  <p className="text-2xl font-black text-white tabular-nums tracking-tight">{Number(particao.casa_valor).toFixed(2)}€</p>
               </div>
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
         </div>

         <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 flex items-center justify-between shadow-2xl group hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><Landmark size={24} /></div>
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Conta Bancária</p>
                  <p className="text-2xl font-black text-white tabular-nums tracking-tight">{Number(particao.banco_valor).toFixed(2)}€</p>
               </div>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
         </div>
      </div>

      {/* FORMULÁRIO DE TRANSFERÊNCIA INTERNA */}
      {isAdmin && (
         <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
               <ArrowRightLeft className="text-primary" size={18} /> Transferência Interna
            </h3>
            
            <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
               <select value={transferencia.de} onChange={e => setTransferencia({...transferencia, de: e.target.value})} className="bg-slate-950 border border-white/10 rounded-2xl h-14 px-4 text-xs font-black text-white outline-none">
                  <option value="BANCO">BANCO 🏦</option>
                  <option value="CASA">CASA 🎰</option>
               </select>
               <div className="flex justify-center text-primary/50"><ArrowRightLeft size={16} /></div>
               <select value={transferencia.para} onChange={e => setTransferencia({...transferencia, para: e.target.value})} className="bg-slate-950 border border-white/10 rounded-2xl h-14 px-4 text-xs font-black text-white outline-none">
                  <option value="CASA">CASA 🎰</option>
                  <option value="BANCO">BANCO 🏦</option>
               </select>
            </div>

            <div className="relative h-16">
               <input type="number" placeholder="Valor a transferir..." className="w-full h-full bg-slate-950 border border-white/10 rounded-2xl px-6 text-lg font-black text-white outline-none" value={transferencia.valor} onChange={e => setTransferencia({...transferencia, valor: e.target.value})} />
               <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">€</span>
            </div>

            <button onClick={handleTransfer} disabled={saving} className="w-full h-16 bg-primary text-slate-950 rounded-[28px] font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
               {saving ? <Loader2 className="animate-spin" /> : 'Confirmar Transferência 🔄'}
            </button>
         </div>
      )}

      {/* HISTÓRICO DE TRANSFERÊNCIAS (NOVO!) */}
      <div className="space-y-6">
         <h3 className="text-white font-black text-[11px] uppercase tracking-widest italic ml-4 flex items-center gap-2">
            <History size={16} className="text-slate-500" /> Histórico de Tesouraria
         </h3>
         <div className="space-y-3">
            {transfers.map((t) => (
               <div key={t.id} className="bg-slate-900 border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                        <ArrowRightLeft size={16} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{t.origem} <span className="text-primary tracking-widest mx-1">→</span> {t.destino}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{new Date(t.data).toLocaleString('pt-PT')}</p>
                     </div>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums tracking-tighter">{Number(t.valor).toFixed(2)}€</span>
               </div>
            ))}
            {transfers.length === 0 && (
               <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Sem registos de transferência.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Financeiro;
