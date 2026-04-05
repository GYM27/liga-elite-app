import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  ArrowLeft, PieChart, TrendingUp, TrendingDown, 
  Wallet, PlusCircle, X, Check, AlertCircle, 
  UserCheck, Download, Zap, Calendar, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Estatisticas = () => {
  const navigate = useNavigate();
  const { stats, ranking, loading, fetchData } = useDashboardData();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const isAdmin = localStorage.getItem('user_role') === 'admin';

  const [formData, setFormData] = useState({ 
    valor: '', tipo: 'ENTRADA', descricao: '', pago: true, jogador_id: '' 
  });
  const [saving, setSaving] = useState(false);

  const provisionMonthlyDebts = async (currentRanking) => {
    if (!isAdmin || !currentRanking || currentRanking.length === 0) return;
    const mesA = new Date().toLocaleString('pt-PT', { month: 'long' });
    const anoA = new Date().getFullYear();
    try {
      const { data: existencias } = await supabase.from('mensalidades').select('jogador_id').eq('mes', mesA).eq('ano', anoA);
      const idsPagos = new Set((existencias || []).map(e => e.jogador_id));
      const novosRegistos = currentRanking.filter(p => !idsPagos.has(p.jogador_id)).map(p => ({
           jogador_id: p.jogador_id, mes: mesA, ano: anoA,
           pago: false, valor_pago: 0, vencimento: new Date(), created_at: new Date()
      }));
      if (novosRegistos.length > 0) { await supabase.from('mensalidades').insert(novosRegistos); fetchData(); }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!loading && ranking.length > 0) { provisionMonthlyDebts(ranking); }
  }, [loading, ranking.length]);

  const handlePayMonthly = async (player, monthLabel) => {
    if (!isAdmin || !confirm(`Liquidar mensalidade de 5.00€ (${monthLabel})?`)) return;
    setSaving(true);
    try {
      const anoA = new Date().getFullYear();
      await supabase.from('banca_transacoes').insert([{
        valor: 5.0, tipo: 'MENSALIDADE', descricao: `Mensalidade ${monthLabel} - ${player.nome}`, pago: true, jogador_id: player.jogador_id, created_at: new Date()
      }]);

      await supabase.from('mensalidades').upsert({ 
        jogador_id: player.jogador_id, mes: monthLabel, ano: anoA, 
        pago: true, valor_pago: 5.0, vencimento: new Date(), updated_at: new Date()
      }, { onConflict: 'jogador_id,mes,ano' });

      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) {
         const nS = (Number(bP.banco_valor) || 0) + 5.0;
         await supabase.from('banca_particoes').update({ banco_valor: nS }).eq('id', 1);
      }
      alert('Pago! ✅');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleUnpayMonthly = async (player, monthLabel) => {
    if (!isAdmin || !confirm(`Anular pagamento de 5.00€ (${monthLabel})? Dinheiro sairá do banco.`)) return;
    setSaving(true);
    try {
      const anoA = new Date().getFullYear();
      await supabase.from('mensalidades').upsert({ 
        jogador_id: player.jogador_id, mes: monthLabel, ano: anoA, 
        pago: false, valor_pago: 0, updated_at: new Date()
      }, { onConflict: 'jogador_id,mes,ano' });

      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) {
         const nS = (Number(bP.banco_valor) || 0) - 5.0;
         await supabase.from('banca_particoes').update({ banco_valor: nS }).eq('id', 1);
      }
      await supabase.from('banca_transacoes').delete().eq('jogador_id', player.jogador_id).eq('tipo', 'MENSALIDADE').like('descricao', `%${monthLabel}%`);
      alert('Anulado! 🏮');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handlePayDebt = async (debt) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await supabase.from('banca_transacoes').update({ pago: true }).eq('id', debt.id);
      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) {
         const nS = (Number(bP.banco_valor) || 0) + Math.abs(debt.valor);
         await supabase.from('banca_particoes').update({ banco_valor: nS }).eq('id', 1);
      }
      alert('Liquidado! ✅');
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.valor || !formData.descricao) return;
    setSaving(true);
    const amount = Number(formData.valor.replace(',', '.'));
    try {
      const { error: tError } = await supabase.from('banca_transacoes').insert([{
        valor: amount, tipo: formData.tipo, descricao: formData.descricao,
        pago: formData.pago, jogador_id: formData.jogador_id || null, created_at: new Date()
      }]);
      if (tError) throw tError;
      if (formData.pago) {
        const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
        if (bP) {
           const nS = (Number(bP.banco_valor) || 0) + (formData.tipo === 'SAIDA' ? -amount : amount);
           await supabase.from('banca_particoes').update({ banco_valor: nS }).eq('id', 1);
        }
      }
      alert('Registado! ✅');
      setFormData({ valor: '', tipo: 'ENTRADA', descricao: '', pago: true, jogador_id: '' });
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleShareGlobalReport = () => {
    const mesAtual = new Date().toLocaleString('pt-PT', { month: 'long' });
    const pagos = ranking.filter(p => !p.em_divida);
    const emFalta = ranking.filter(p => p.em_divida);
    const texto = `🏆 *LIGA DE ELITE* 🏆\n📅 *Relatório ${mesAtual} 2026*\n\n✅ *PAGOS:*\n${pagos.map(p => ` • ${p.nome}`).join('\n')}\n\n🏮 *DÍVIDAS:*\n${emFalta.map(p => ` • ${p.nome}`).join('\n')}\n\n*Comandante: Luís* 🛡️⚡`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (loading) return <div className="text-white text-center mt-20 font-black uppercase text-xs">Aguarde...</div>;

  const MESES_EPOCA = ['Junho 2025', 'Julho 2025', 'Agosto 2025', 'Setembro 2025', 'Outubro 2025', 'Novembro 2025', 'Dezembro 2025', 'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10 max-w-lg mx-auto">
      
      {/* CABEÇALHO */}
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

      {/* GRELHA DE MEMBROS (ESTRUTURA DE COR SOLICITADA) */}
      <section className="px-2 space-y-4">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2"><UserCheck size={18} /> Auditoria de Membros</h3>
            <button onClick={handleShareGlobalReport} className="px-3 h-8 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[8px] font-black uppercase tracking-widest">Global</button>
         </div>
         <div className="grid grid-cols-3 gap-3">
            {ranking.map((p) => (
               <button 
                 key={p.jogador_id} 
                 onClick={() => setSelectedPlayer(p)}
                 className={`flex flex-col items-center justify-center p-3 rounded-[32px] bg-slate-900 border-2 transition-all active:scale-95 relative overflow-hidden group ${p.em_divida ? 'border-rose-500' : 'border-emerald-500'}`}
               >
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 mb-2 ${p.em_divida ? 'border-rose-500/50' : 'border-emerald-500/50'}`}>
                     {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-500 uppercase">{p.nome.substring(0,2)}</div>}
                  </div>
                  <p className={`text-[10px] font-black uppercase text-center truncate w-full italic ${p.em_divida ? 'text-rose-400' : 'text-emerald-400'}`}>{p.nome.split(' ')[0]}</p>
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${p.em_divida ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               </button>
            ))}
         </div>
      </section>

      {/* SALDO EM CAIXA REAL */}
      <div className="px-2">
         <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center text-left">
               <div>
                  <h4 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] mb-2 italic">Saldo em Caixa Real</h4>
                  <p className="text-6xl font-display font-black text-white tracking-tighter italic">{stats.saldo.toFixed(2)}€</p>
               </div>
               <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><Wallet size={32} /></div>
            </div>
         </div>
      </div>

      {/* HISTORIAL */}
      <section className="px-2 space-y-4">
         <div className="flex items-center gap-3 px-1"><Calendar size={18} className="text-slate-500" /><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Transações Recentes</h3></div>
         <div className="space-y-3">
            {stats.transacoes?.slice().reverse().slice(0, 10).map((t, idx) => (
               <div key={t.id || idx} className="bg-slate-900 border border-white/5 p-5 rounded-[32px] flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.pago ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.pago ? <TrendingUp size={14} /> : <AlertCircle size={14} />}</div>
                     <div><p className="text-xs font-black text-white italic truncate max-w-[150px]">{t.descricao}</p><p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-widest">{new Date(t.created_at).toLocaleDateString()}</p></div>
                  </div>
                  <p className={`text-lg font-display font-black tracking-tight ${t.pago ? 'text-emerald-400' : 'text-slate-500'}`}>{t.tipo === 'ENTRADA' ? '+' : '-'}{Math.abs(t.valor).toFixed(2)}€</p>
               </div>
            ))}
         </div>
      </section>

      {/* MODAL AUDITORIA SÓCIO */}
      {selectedPlayer && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border-2 border-primary/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative">
               <div className="flex justify-between items-start text-left">
                  <div>
                     <h3 className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4 tracking-widest leading-loose">Auditória Individual</h3>
                     <p className="text-2xl font-black text-white mt-1 uppercase italic">{selectedPlayer.nome}</p>
                     
                     <button 
                        onClick={() => {
                           setFormData({ ...formData, jogador_id: selectedPlayer.jogador_id, pago: false, tipo: 'MULTA', descricao: '' });
                           setIsAddModalOpen(true);
                           setSelectedPlayer(null);
                        }}
                        className="mt-3 flex items-center gap-2 px-4 h-9 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-500 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
                     >
                        <Zap size={14} /> Emitir Novo
                     </button>
                  </div>
                  <button onClick={() => setSelectedPlayer(null)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button>
               </div>
               
               <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide py-2 text-left">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] italic flex items-center gap-2"><AlertCircle size={14} /> Pendências Elite</p>
                     <div className="space-y-3">
                        {selectedPlayer.dividas_pendentes?.length > 0 && selectedPlayer.dividas_pendentes.map(d => (
                           <button key={d.id} onClick={() => handlePayDebt(d)} className="w-full bg-white/5 border-2 border-rose-500/30 p-5 rounded-[32px] flex justify-between items-center transition-all active:scale-95">
                              <div><p className="text-[10px] font-black text-white uppercase italic">{d.descricao}</p><p className="text-2xl font-display font-black text-rose-500">{Math.abs(d.valor).toFixed(2)}€</p></div>
                              <div className="bg-primary text-slate-900 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest">LIQUIDAR</div>
                           </button>
                        ))}
                        {MESES_EPOCA.map(m => {
                           const isPaid = selectedPlayer.historico_mensalidades?.[m];
                           if (isPaid) return null;
                           return (
                              <button 
                                 key={m} 
                                 onClick={() => handlePayMonthly(selectedPlayer, m)}
                                 className="w-full p-5 rounded-[32px] border-2 bg-white/5 border-rose-500/30 flex justify-between items-center transition-all active:scale-95"
                              >
                                 <div><p className="text-[10px] font-black text-white uppercase italic">{m}</p><p className="text-2xl font-display font-black text-rose-400">5.00€</p></div>
                                 <div className="bg-primary text-slate-950 h-12 px-6 rounded-2xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-primary/20"><Wallet size={16} /> PAGAR</div>
                              </button>
                           );
                        })}
                        {(!selectedPlayer.dividas_pendentes || selectedPlayer.dividas_pendentes.length === 0) && 
                         MESES_EPOCA.every(m => selectedPlayer.historico_mensalidades?.[m]) && (
                           <div className="text-center py-10 opacity-50 space-y-4">
                              <Check size={40} className="mx-auto text-emerald-500" />
                              <p className="text-xs font-black text-white uppercase italic tracking-widest">Tudo Regularizado!</p>
                              <div className="pt-4 border-t border-white/5">
                                 <button onClick={() => handleUnpayMonthly(selectedPlayer, 'Abril 2026')} className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-rose-500 text-[8px] font-black uppercase tracking-widest font-display">Anular Abril</button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL LANÇAMENTO MANUAL */}
      {isAddModalOpen && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border-2 border-primary/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
               <div className="flex justify-between items-center px-1"><h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3"><Zap size={20} className="text-primary" /> Emissão de Registro</h3><button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button></div>
               <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                     <span className={`text-[8px] font-black uppercase tracking-widest ${!formData.pago ? 'text-rose-500' : 'text-emerald-500'}`}>{!formData.pago ? 'GERAR DÍVIDA' : 'DINHEIRO RECEBIDO'}</span>
                     <button type="button" onClick={() => setFormData({...formData, pago: !formData.pago})} className={`w-12 h-6 rounded-full relative transition-all ${formData.pago ? 'bg-emerald-500' : 'bg-rose-500'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.pago ? 'right-1' : 'left-1'}`}></div></button>
                  </div>
                  <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Vínculo Sócio</p><select value={formData.jogador_id} onChange={e => setFormData({...formData, jogador_id: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white outline-none"><option value="">GERAL</option>{ranking.map(p => <option key={p.jogador_id} value={p.jogador_id}>{p.nome}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Tipo</p><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white outline-none"><option value="ENTRADA">ENTRADA</option><option value="MULTA">MULTA</option><option value="SAIDA">SAÍDA</option></select></div><div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-center">Valor (€)</p><input type="text" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-xl font-display font-black text-white text-center" /></div></div>
                  <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Descrição</p><input type="text" placeholder="..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white uppercase italic" /></div>
                  <button type="submit" disabled={saving} className="w-full h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">{saving ? '...' : 'CONFIRMAR'}</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Estatisticas;
