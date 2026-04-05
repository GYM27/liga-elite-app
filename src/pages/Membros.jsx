import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { 
  UserPlus, Save, Trash2, Camera, User, 
  AlertCircle, Coins, Check, X, PlusCircle, 
  Wallet, Trophy, MessageCircle, Calendar, 
  Loader2, Link2, Settings2, History, Zap
} from 'lucide-react';

const Membros = () => {
  const { isAdmin } = useAdmin();
  const { ranking, loading, fetchData, currentMonth } = useDashboardData();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', foto_url: '', liga_atual: 'Norte', divida: 0, motivo_divida: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (player) => {
    setEditingId(player.jogador_id);
    setFormData({ 
      nome: player.nome, 
      foto_url: player.foto_url || '', 
      liga_atual: player.liga_atual || 'Norte', 
      divida: player.divida || 0, 
      motivo_divida: player.motivo_divida || '' 
    });
  };

  const handleSave = async (id) => {
    try {
      const updateData = isAdmin ? { 
        nome: formData.nome, 
        foto_url: formData.foto_url,
        liga_atual: formData.liga_atual 
      } : { foto_url: formData.foto_url };
      const { error } = await supabase.from('jogadores').update(updateData).eq('id', id);
      if (error) throw error;
      alert('Perfil Atualizado! 🚀');
      setEditingId(null);
      fetchData();
    } catch (err) { alert('Erro: ' + err.message); }
  };

  const handleAddPlayer = async () => {
     if (!isAdmin) return;
     if (!formData.nome) return;
     try {
        const { error } = await supabase.from('jogadores').insert([{
           nome: formData.nome,
           foto_url: formData.foto_url,
           liga_atual: formData.liga_atual
        }]);
        if (error) throw error;
        alert('Recruta Alistado! 🏁');
        setIsAdding(false);
        setFormData({ nome: '', foto_url: '', liga_atual: 'Norte' });
        fetchData();
     } catch (err) { alert(err.message); }
  };

  const generateGlobalReport = () => {
    if (!isAdmin) return;
    const pagos = ranking.filter(p => !p.em_divida).map(p => `✅ ${p.nome}`);
    const emFalta = ranking.filter(p => p.em_divida).map(p => `🚨 *${p.nome}* (${p.motivo_divida})`);
    let report = `🏆 *LIGA DE ELITE - AUDITORIA* 🏆\n📅 *ESTADO GERAL*\n\n✅ *PAGOS:* \n${pagos.length > 0 ? pagos.join('\n') : '_Nenhum_ 🏮'}\n\n🚨 *DÍVIDAS:* \n${emFalta.length > 0 ? emFalta.join('\n') : '_Nenhum_ 🔥'}\n\n_Comandante: Luís_ 🏁`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs">Recrutando Elite...</div>;

  const sections = [
    { t: 'Norte', d: ranking.filter(p => p.liga_atual === 'Norte'), c: 'text-blue-400' },
    { t: 'Sul', d: ranking.filter(p => p.liga_atual === 'Sul'), c: 'text-orange-400' },
    { t: 'AUTO / FORA', d: ranking.filter(p => !p.liga_atual), c: 'text-emerald-400' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-2 max-w-lg mx-auto">
      <div className="mb-4 flex justify-between items-center px-1 pt-4 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <User className="text-primary" size={28} />
          <span>Membros <span className="text-primary tracking-widest text-xl">Elite</span></span>
        </h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={generateGlobalReport} className="w-12 h-12 bg-emerald-500 text-slate-900 rounded-2xl flex items-center justify-center active:scale-90 transition-all"><MessageCircle size={22} strokeWidth={3} /></button>
            <button onClick={() => setIsAdding(true)} className="w-12 h-12 bg-primary text-slate-950 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xl"><UserPlus size={22} strokeWidth={3} /></button>
          </div>
        )}
      </div>

      {isAdding && isAdmin && (
         <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3"><UserPlus size={18} className="text-primary" /> Novo Recruta</h3>
            <div className="space-y-4">
               <input type="text" placeholder="Nome do Sócio..." className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
               <div className="flex gap-2">
                  <button onClick={handleAddPlayer} className="flex-1 h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[11px] active:scale-95">Alistar</button>
                  <button onClick={() => setIsAdding(false)} className="px-6 h-14 bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] active:scale-95">Sair</button>
               </div>
            </div>
         </div>
      )}

      {sections.map(liga => liga.d.length > 0 && (
        <div key={liga.t} className="space-y-5 text-left">
          <h3 className={`text-[11px] font-black ${liga.c} uppercase tracking-[0.3em] italic flex items-center gap-3 ml-2`}>
            <div className={`w-1 h-4 ${liga.c.replace('text', 'bg')} rounded-full`}></div> Liga {liga.t}
          </h3>
          <div className="grid grid-cols-1 gap-5">
            {liga.d.map((player) => (
              <MemberCard key={player.jogador_id} player={player} isAdmin={isAdmin} currentMonth={currentMonth} onComplete={fetchData} editingId={editingId} setEditingId={setEditingId} formData={formData} setFormData={setFormData} handleSave={handleSave} handleEdit={handleEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MemberCard = ({ player, isAdmin, currentMonth, onComplete, editingId, setEditingId, formData, setFormData, handleSave, handleEdit }) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const MESES_EPOCA = ['Junho 2025', 'Julho 2025', 'Agosto 2025', 'Setembro 2025', 'Outubro 2025', 'Novembro 2025', 'Dezembro 2025', 'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026'];

  const handlePay = async (month) => {
    if (!isAdmin || !confirm(`Pagar 5€ (${month})?`)) return;
    setSaving(true);
    try {
      await supabase.from('banca_transacoes').insert([{ valor: 5.0, tipo: 'MENSALIDADE', descricao: `Mensalidade ${month} - ${player.nome}`, pago: true, jogador_id: player.jogador_id, created_at: new Date() }]);
      await supabase.from('mensalidades').upsert({ jogador_id: player.jogador_id, mes: month, ano: 2026, pago: true, valor_pago: 5.0, updated_at: new Date() }, { onConflict: 'jogador_id,mes,ano' });
      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) + 5.0 }).eq('id', 1);
      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleUnpay = async (month) => {
    if (!isAdmin || !confirm(`Anular 5€ (${month})?`)) return;
    setSaving(true);
    try {
      await supabase.from('mensalidades').upsert({ jogador_id: player.jogador_id, mes: month, ano: 2026, pago: false, valor_pago: 0, updated_at: new Date() }, { onConflict: 'jogador_id,mes,ano' });
      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) - 5.0 }).eq('id', 1);
      await supabase.from('banca_transacoes').delete().eq('jogador_id', player.jogador_id).eq('tipo', 'MENSALIDADE').like('descricao', `%${month}%`);
      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handlePayDebt = async (debt) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await supabase.from('banca_transacoes').update({ pago: true }).eq('id', debt.id);
      const { data: bP } = await supabase.from('banca_particoes').select('banco_valor').eq('id', 1).maybeSingle();
      if (bP) await supabase.from('banca_particoes').update({ banco_valor: (Number(bP.banco_valor) || 0) + Math.abs(debt.valor) }).eq('id', 1);
      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const generateIndividualReport = () => {
    const pagos = MESES_EPOCA.filter(m => player.historico_mensalidades?.[m]);
    const emFalta = MESES_EPOCA.filter(m => !player.historico_mensalidades?.[m]);
    const multas = player.dividas_pendentes || [];
    
    let report = `🏆 *LIGA DE ELITE - RELATÓRIO* 🏆\n👤 *Sócio:* ${player.nome}\n\n✅ *LIQUIDADOS (PAGOS):*\n${pagos.length > 0 ? pagos.map(m => ` • ${m} (5€)`).join('\n') : '_Nenhuma faturada ainda._'}\n\n🏮 *PENDENTES (EM FALTA):*\n${emFalta.map(m => ` • Mensalidade ${m} (5€)`).join('\n')}\n${multas.length > 0 ? multas.map(d => ` • ${d.descricao} (${Math.abs(d.valor).toFixed(2)}€)`).join('\n') : ''}\n\n💰 *TOTAL EM DÍVIDA:* ${(emFalta.length * 5 + multas.reduce((acc, d) => acc + Math.abs(d.valor), 0)).toFixed(2)}€\n\n_Comandante: Luís_ 🛡️⚡`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${player.jogador_id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
       const filePath = `membros/${fileName}`;
       await supabase.storage.from('fotos').upload(filePath, file);
       const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(filePath);
       await supabase.from('jogadores').update({ foto_url: publicUrl }).eq('id', player.jogador_id);
       if (onComplete) await onComplete();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const IsEditing = editingId === player.jogador_id;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-[32px] p-6 transition-all duration-300 ${player.em_divida ? 'border-rose-500 shadow-rose-900/10' : IsEditing ? 'border-primary ring-4 ring-primary/5' : 'border-white/5'}`}>
      {IsEditing ? (
        <div className="space-y-6 text-left">
           <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById(`upload-${player.jogador_id}`).click()}>
                 <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-2xl flex items-center justify-center text-primary">{saving ? <Loader2 className="animate-spin" /> : <Camera size={24} />}</div>
                 <input id={`upload-${player.jogador_id}`} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              <p className="text-white font-black text-sm uppercase italic">Perfis de Elite</p>
           </div>
           <div className="space-y-4">
              <input type="text" className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none" value={formData.nome} onChange={(e) => isAdmin && setFormData({...formData, nome: e.target.value})} readOnly={!isAdmin} />
              {isAdmin && (
                 <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-white/5 h-14 items-center">
                    <button onClick={() => setFormData({...formData, liga_atual: 'Norte'})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase ${formData.liga_atual === 'Norte' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>NORTE</button>
                    <button onClick={() => setFormData({...formData, liga_atual: null})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase ${formData.liga_atual === null ? 'bg-emerald-500 text-slate-900' : 'text-slate-600'}`}>AUTO</button>
                    <button onClick={() => setFormData({...formData, liga_atual: 'Sul'})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase ${formData.liga_atual === 'Sul' ? 'bg-orange-500 text-white' : 'text-slate-600'}`}>SUL</button>
                 </div>
              )}
           </div>
           <div className="flex gap-3">
              <button onClick={() => handleSave(player.jogador_id)} className="flex-1 h-14 bg-primary text-slate-950 rounded-3xl font-black uppercase text-[11px] active:scale-95">Gravar</button>
              <button onClick={() => setEditingId(null)} className="px-6 h-14 bg-slate-800 text-white rounded-3xl font-black uppercase text-[10px] active:scale-95">Sair</button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 text-left">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-[24px] overflow-hidden border-2 shadow-2xl bg-slate-950 flex-shrink-0 ${player.em_divida ? 'border-rose-500' : 'border-white/5'}`}>
               {player.foto_url ? <img src={player.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-2xl italic">{player.nome.substring(0,2)}</div>}
            </div>
            <div className="min-w-0 flex-1">
               <h4 className="text-white font-black text-xl italic uppercase truncate leading-tight">{player.nome}</h4>
               <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 ${player.em_divida ? 'text-rose-500' : 'text-slate-500'}`}>{player.em_divida ? 'SITUAÇÃO CRÍTICA' : (player.liga_atual || 'Estatuto Auto')}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
              <button onClick={() => handleEdit(player)} className="flex-1 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white active:scale-90 shadow-md"><Settings2 size={22} /></button>
              <button onClick={() => setShowAuditModal(true)} className={`flex-[1.5] h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${player.em_divida ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse font-display' : 'bg-slate-950 border border-emerald-500/20 text-emerald-500'}`}>
                <Wallet size={22} className="mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest italic pt-0.5">Auditória</span>
              </button>
          </div>

          {showAuditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in">
               <div className="bg-slate-900 border-2 border-primary/10 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
                  <div className="flex justify-between items-start">
                     <div><h3 className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4">Auditória Indivual</h3><p className="text-2xl font-black text-white italic truncate mt-2 leading-tight">{player.nome}</p></div>
                     <button onClick={() => setShowAuditModal(false)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button>
                  </div>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide py-2">
                     <div className="space-y-3">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] italic flex items-center gap-2"><AlertCircle size={10} /> Pendências</p>
                        {player.dividas_pendentes?.map(d => (
                           <button key={d.id} onClick={() => handlePayDebt(d)} className="w-full bg-white/5 border-2 border-rose-500/20 p-5 rounded-[32px] flex justify-between items-center transition-all active:scale-95">
                              <div><p className="text-[10px] font-black text-white uppercase italic">{d.descricao}</p><p className="text-2xl font-display font-black text-rose-500">{Math.abs(d.valor).toFixed(2)}€</p></div>
                              <div className="bg-primary text-slate-900 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest">Pagar</div>
                           </button>
                        ))}
                        {MESES_EPOCA.map(m => {
                           const isPaid = player.historico_mensalidades?.[m];
                           if (isPaid) return null;
                           return (
                              <button key={m} onClick={() => handlePay(m)} className="w-full bg-white/5 border-2 border-rose-500/20 p-5 rounded-[32px] flex justify-between items-center transition-all active:scale-95 text-left">
                                 <div><p className="text-[10px] font-black text-white uppercase italic">{m}</p><p className="text-2xl font-display font-black text-rose-400">5.00€</p></div>
                                 <div className="bg-primary text-slate-950 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Liquidada</div>
                              </button>
                           );
                        })}
                        <div className="pt-4 border-t border-white/5">
                           <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic flex items-center gap-2"><Check size={10} /> Liquidados</p>
                           <div className="mt-2 space-y-2">
                             {MESES_EPOCA.map(m => {
                                const isPaid = player.historico_mensalidades?.[m];
                                if (!isPaid) return null;
                                return (
                                   <div key={m} className="w-full bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-2xl flex justify-between items-center opacity-80">
                                      <span className="text-[10px] font-black text-emerald-500 uppercase">{m} (PAGO)</span>
                                      <button onClick={() => handleUnpay(m)} className="text-rose-500 text-[10px] font-black underline flex items-center gap-1"><X size={12} /> Anular</button>
                                   </div>
                                );
                             })}
                           </div>
                        </div>
                     </div>
                  </div>
                  <button onClick={generateIndividualReport} className="w-full h-14 bg-emerald-500 text-slate-900 rounded-[24px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-500/20"><Zap size={18} /> Gerar Relatório</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Membros;