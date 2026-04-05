import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  ArrowLeft, PieChart, TrendingUp, TrendingDown, 
  Wallet, PlusCircle, X, Check, AlertCircle, 
  UserCheck, Download, Zap, Calendar, MessageSquare,
  Loader2, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Estatisticas = () => {
  const navigate = useNavigate();
  const { stats, ranking, loading, fetchData } = useDashboardData();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const isAdmin = true; 

  const [formData, setFormData] = useState({ 
    valor: '', tipo: 'ENTRADA', descricao: '', pago: true, jogador_id: '' 
  });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const monthsList = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const formattedMonthGlobal = `${monthsList[now.getMonth()]} ${now.getFullYear()}`;

  const provisionMonthlyDebts = async (currentRanking) => {
    if (!currentRanking || currentRanking.length === 0) return;
    try {
      const { data: existencias } = await supabase.from('mensalidades').select('jogador_id').eq('mes', formattedMonthGlobal);
      const idsPagos = new Set((existencias || []).map(e => e.jogador_id));
      const novosRegistos = currentRanking.filter(p => !idsPagos.has(p.jogador_id)).map(p => ({
           jogador_id: p.jogador_id, mes: formattedMonthGlobal, pago: false
      }));
      if (novosRegistos.length > 0) { await supabase.from('mensalidades').insert(novosRegistos); fetchData(); }
    } catch (err) { console.error('Erro Provisionamento:', err); }
  };

  useEffect(() => {
    if (!loading && ranking.length > 0) { provisionMonthlyDebts(ranking); }
  }, [loading, ranking.length]);

  const handlePayMonthly = async (player, monthLabel) => {
    setStatusMsg({ t: 'PROCESSANDO...', c: 'text-primary animate-pulse' });
    try {
      // PURGA DE created_at PARA EVITAR 400
      const { error: tErr } = await supabase.from('banca_transacoes').insert([{
        valor: 5.0, tipo: 'MENSALIDADE', descricao: `Mensalidade ${monthLabel} - ${player.nome}`, jogador_id: player.jogador_id
      }]);
      
      const { error: mErr } = await supabase.from('mensalidades').upsert({ 
        jogador_id: player.jogador_id, mes: monthLabel, pago: true
      }, { onConflict: 'jogador_id,mes' });
      
      if (mErr || tErr) {
        setStatusMsg({ t: 'ERRO: ' + (mErr?.message || tErr?.message), c: 'text-rose-500' });
        return;
      }

      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) {
         await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) + 5.0 }).eq('id', 1);
      }
      
      setStatusMsg({ t: 'PAGO COM SUCESSO! 🏁', c: 'text-emerald-500 font-bold' });
      fetchData();
    } catch (err) { 
      setStatusMsg({ t: 'CRASH: ' + err.message, c: 'text-rose-500' });
    }
  };

  const handleUnpayMonthly = async (player, monthLabel) => {
    setStatusMsg({ t: 'ANULANDO...', c: 'text-rose-400 animate-pulse' });
    setSaving(true);
    try {
      const { error: mErr } = await supabase.from('mensalidades').upsert({ 
        jogador_id: player.jogador_id, mes: monthLabel, pago: false
      }, { onConflict: 'jogador_id,mes' });
      
      if (mErr) { setStatusMsg({ t: 'ERRO: ' + mErr.message, c: 'text-rose-500' }); return; }

      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) - 5.0 }).eq('id', 1);
      
      await supabase.from('banca_transacoes').delete().eq('jogador_id', player.jogador_id).eq('tipo', 'MENSALIDADE').like('descricao', `%${monthLabel}%`);
      
      setStatusMsg({ t: 'ANULAÇÃO CONCLUÍDA! 🏮', c: 'text-rose-500 font-bold' });
      await fetchData();
    } catch (err) { setStatusMsg({ t: 'ERRO: ' + err.message, c: 'text-rose-500' }); }
    finally { setSaving(false); }
  };

  const handlePayDebt = async (debt) => {
    setStatusMsg({ t: 'LIQUIDANDO...', c: 'text-primary animate-pulse' });
    try {
      await supabase.from('banca_transacoes').update({ pago: true }).eq('id', debt.id);
      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) + Math.abs(debt.valor) }).eq('id', 1);
      
      setStatusMsg({ t: 'LIQUIDADO COM SUCESSO! ✅', c: 'text-emerald-500 font-bold' });
      await fetchData();
    } catch (err) { setStatusMsg({ t: 'ERRO: ' + err.message, c: 'text-rose-500' }); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.valor || !formData.descricao) return;
    setSaving(true);
    const amount = Number(formData.valor.replace(',', '.'));
    try {
      const { error: tError } = await supabase.from('banca_transacoes').insert([{
        valor: amount, tipo: formData.tipo, descricao: formData.descricao,
        jogador_id: formData.jogador_id || null
      }]);
      if (tError) throw tError;
      if (formData.pago) {
        const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
        if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) + (formData.tipo === 'SAIDA' ? -amount : amount) }).eq('id', 1);
      }
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleShareGlobalReport = () => {
    const texto = `🏆 *LIGA DE ELITE* 🏆\n📅 *Relatório Abril 2026*\n\n✅ *PAGOS:*\n${ranking.filter(p => !p.em_divida).map(p => ` • ${p.nome}`).join('\n')}\n\n🏮 *DÍVIDAS:*\n${ranking.filter(p => p.em_divida).map(p => ` • ${p.nome}`).join('\n')}\n\n*Comandante: Luís* 🛡️⚡`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (loading) return <div className="text-white text-center mt-20 font-black uppercase text-xs tracking-widest italic">Sincronizando Elite...</div>;

  const MESES_EPOCA = ['Junho 2025', 'Julho 2025', 'Agosto 2025', 'Setembro 2025', 'Outubro 2025', 'Novembro 2025', 'Dezembro 2025', 'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10 max-w-lg mx-auto">
      <div className="pt-4 px-2 flex justify-between items-center text-left">
         <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"><ArrowLeft size={20} /></button>
         <div className="text-center flex-1">
            <h2 className="text-2xl font-black text-white uppercase italic flex items-center justify-center gap-2">
               <PieChart className="text-primary" size={24} />
               <span>Tesouraria <span className="text-primary text-sm italic">Elite</span></span>
            </h2>
         </div>
         <button onClick={() => setIsAddModalOpen(true)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary"><PlusCircle size={20} /></button>
      </div>

      <section className="px-2 space-y-4 text-left">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2"><UserCheck size={18} /> Auditoria de Membros</h3>
            <button onClick={handleShareGlobalReport} className="px-3 h-8 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[8px] font-black uppercase tracking-widest">Global</button>
         </div>
         <div className="grid grid-cols-3 gap-3">
            {ranking.map((p) => (
               <button key={p.jogador_id} onClick={() => { setSelectedPlayer(p); setStatusMsg(null); }} className={`flex flex-col items-center justify-center p-3 rounded-[32px] bg-slate-900 border-2 transition-all active:scale-95 relative overflow-hidden group ${p.em_divida ? 'border-rose-500' : 'border-emerald-500'}`}>
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 mb-2 ${p.em_divida ? 'border-rose-500/50' : 'border-emerald-500/50'}`}>{p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-500 uppercase">{p.nome.substring(0,2)}</div>}</div>
                  <p className={`text-[10px] font-black uppercase text-center truncate w-full italic ${p.em_divida ? 'text-rose-400' : 'text-emerald-400'}`}>{p.nome.split(' ')[0]}</p>
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${p.em_divida ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               </button>
            ))}
         </div>
      </section>

      <div className="px-2 text-left">
         <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div>
               <h4 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] mb-2 italic tracking-widest">Saldo em Caixa Real</h4>
               <p className="text-6xl font-display font-black text-white tracking-tighter italic">{stats.saldo.toFixed(2)}€</p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner shadow-primary/20"><Wallet size={32} /></div>
         </div>
      </div>

      <section className="px-2 space-y-4 text-left">
         <div className="flex items-center gap-3 px-1"><Calendar size={18} className="text-slate-500" /><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Histórico de Transações</h3></div>
         <div className="space-y-3">
            {stats.transacoes?.slice().reverse().slice(0, 10).map((t, idx) => (
               <div key={t.id || idx} className="bg-slate-900 border border-white/5 p-5 rounded-[32px] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.pago ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.pago ? <TrendingUp size={14} /> : <AlertCircle size={14} />}</div>
                     <div><p className="text-xs font-black text-white italic truncate max-w-[150px]">{t.descricao}</p><p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'ELITE/2026'}
                     </p></div>
                  </div>
                  <p className={`text-lg font-display font-black tracking-tight ${t.pago ? 'text-emerald-400' : 'text-slate-500'}`}>{t.tipo === 'ENTRADA' || t.tipo === 'MENSALIDADE' ? '+' : '-'}{Math.abs(t.valor).toFixed(2)}€</p>
               </div>
            ))}
         </div>
      </section>

      {selectedPlayer && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm shadow-2xl">
            <div className="bg-slate-900 border-2 border-primary/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
               <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                     <h3 className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4 leading-loose">Auditória de Membro</h3>
                     <p className="text-2xl font-black text-white mt-1 uppercase italic truncate w-48">{selectedPlayer.nome}</p>
                  </div>
                  <button onClick={() => setSelectedPlayer(null)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button>
               </div>

               {statusMsg && (
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 animate-in zoom-in-95 duration-200 text-center">
                     <p className={`text-[11px] font-black uppercase tracking-widest ${statusMsg.c}`}>{statusMsg.t}</p>
                     <button onClick={() => setStatusMsg(null)} className="mt-2 text-[8px] font-black text-slate-500 uppercase underline">Fechar Aviso</button>
                  </div>
               )}
               
               <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide py-2">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] italic flex items-center gap-2 underline">Pendências Elite</p>
                     <div className="space-y-3">
                        {selectedPlayer.dividas_pendentes?.map(d => (
                           <button key={d.id} onClick={() => handlePayDebt(d)} className="w-full bg-white/5 border-2 border-rose-500/30 p-5 rounded-[32px] flex justify-between items-center transition-all active:scale-95">
                              <div><p className="text-[10px] font-black text-white uppercase italic">{d.descricao}</p><p className="text-2xl font-display font-black text-rose-500">{Math.abs(d.valor).toFixed(2)}€</p></div>
                              <div className="bg-emerald-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">Pagar</div>
                           </button>
                        ))}
                        {MESES_EPOCA.map(m => {
                           const isPaid = selectedPlayer.historico_mensalidades?.[m];
                           if (isPaid) return null;
                           return (
                              <button key={m} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePayMonthly(selectedPlayer, m); }} className="w-full p-5 rounded-[32px] border-2 bg-slate-950 border-rose-500/20 flex justify-between items-center transition-all active:scale-95">
                                 <div><p className="text-[10px] font-black text-white uppercase italic">{m}</p><p className="text-2xl font-display font-black text-rose-400">5.00€</p></div>
                                 <div className="bg-emerald-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">LIQUIDAR</div>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {isAddModalOpen && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-primary/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
               <div className="flex justify-between items-center px-1"><h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3"><Zap size={20} className="text-primary" /> Lançamento</h3><button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button></div>
               <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                     <span className={`text-[8px] font-black uppercase tracking-widest ${!formData.pago ? 'text-rose-500' : 'text-emerald-500'}`}>{!formData.pago ? 'GERAR DÍVIDA' : 'RECEBIDO ✅'}</span>
                     <button type="button" onClick={() => setFormData({...formData, pago: !formData.pago})} className={`w-12 h-6 rounded-full relative transition-all ${formData.pago ? 'bg-emerald-500' : 'bg-rose-500'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.pago ? 'right-1' : 'left-1'}`}></div></button>
                  </div>
                  <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic font-display">Vínculo Sócio</p><select value={formData.jogador_id} onChange={e => setFormData({...formData, jogador_id: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white outline-none"><option value="">GERAL</option>{ranking.map(p => <option key={p.jogador_id} value={p.jogador_id}>{p.nome}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic font-display">Tipo</p><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white outline-none"><option value="ENTRADA">ENTRADA</option><option value="MULTA">MULTA</option><option value="SAIDA">SAÍDA</option></select></div><div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-center font-display">Valor (€)</p><input type="text" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-xl font-display font-black text-white text-center" /></div></div>
                  <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic font-display">Descrição</p><input type="text" placeholder="..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white uppercase italic" /></div>
                  <button type="submit" disabled={saving} className="w-full h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/20">{saving ? '...' : 'CONFIRMAR 🏁'}</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Estatisticas;
