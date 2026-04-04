import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Save, Trash2, Camera, User, AlertCircle, Coins, Check, X, PlusCircle, Wallet, Trophy, MessageCircle, Calendar, Loader2, Link2, Settings2 } from 'lucide-react';

const Membros = () => {
  const { isAdmin } = useAdmin();
  const { ranking, loading, fetchData, currentMonth, currentWeek } = useDashboardData();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', foto_url: '', liga_atual: 'Norte', divida: 0, motivo_divida: '' });
  const [isAdding, setIsAdding] = useState(false);

  // GESTÃO DE PERMISSÃO: Utilizadores podem clicar no editar (apenas fotos/nomes)
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
      // Se não for admin, NUNCA muda o nome nem a liga na base de dados (Cofre Elite)
      const updateData = isAdmin ? { 
        nome: formData.nome, 
        foto_url: formData.foto_url,
        liga_atual: formData.liga_atual 
      } : {
        foto_url: formData.foto_url
      };

      const { error } = await supabase.from('jogadores').update(updateData).eq('id', id);
      
      if (error) throw error;
      alert('Perfil Atualizado com Sucesso! 🚀');
      setEditingId(null);
      fetchData();
    } catch (err) { alert('Erro: ' + err.message); }
  };

  const handleAddPlayer = async () => {
     if (!isAdmin) return alert('Poder Apenas para o Comandante! 🛑');
     if (!formData.nome) return;
     try {
        const { error } = await supabase.from('jogadores').insert([{
           nome: formData.nome,
           foto_url: formData.foto_url,
           liga_atual: formData.liga_atual
        }]);
        if (error) throw error;
        alert('Novo Recruta Alistado! 🏁');
        setIsAdding(false);
        setFormData({ nome: '', foto_url: '', liga_atual: 'Norte' });
        fetchData();
     } catch (err) { alert(err.message); }
  };

  const generatePaymentReport = () => {
    if (!isAdmin) return alert('Acesso Reservado à Tesouraria! 🛑');
    const pagos = ranking.filter(p => p.mensalidade_paga).map(p => `✅ ${p.nome}`);
    const pendentes = ranking.filter(p => !p.mensalidade_paga).map(p => `❌ ${p.nome}`);
    let report = `🏆 *LIGA DE ELITE - MENSALIDADES* 🏆\n📅 *MÊS: ${currentMonth?.toUpperCase() || 'ABRIL'}*\n\n💰 *PAGOS:* \n${pagos.length > 0 ? pagos.join('\n') : '_Ninguém pagou ainda_ 🏮'}\n\n⚠️ *PENDENTES:* \n${pendentes.length > 0 ? pendentes.join('\n') : '_Tudo em dia! 🔥_'}\n\n_Elite Bet_ 🏁`;
    
    const encodedReport = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encodedReport}`, '_blank');
    navigator.clipboard.writeText(report);
    alert('Balanço copiado e WhatsApp aberto! 📱⚡');
  };

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs tracking-widest italic tracking-tight">Recrutando Elite...</div>;

  const sections = [
    { t: 'Norte', d: ranking.filter(p => p.liga_atual === 'Norte'), c: 'text-blue-400' },
    { t: 'Sul', d: ranking.filter(p => p.liga_atual === 'Sul'), c: 'text-orange-400' },
    { t: 'Estatuto Auto', d: ranking.filter(p => !p.liga_atual), c: 'text-emerald-400' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-2 max-w-lg mx-auto">
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center px-1 pt-4">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <User className="text-primary" size={28} />
          <span>Membros <span className="text-primary tracking-widest uppercase text-xl">Elite</span></span>
        </h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={generatePaymentReport} className="w-12 h-12 bg-emerald-500 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><MessageCircle size={22} strokeWidth={3} /></button>
            <button onClick={() => setIsAdding(true)} className="w-12 h-12 bg-primary text-slate-950 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xl"><UserPlus size={22} strokeWidth={3} /></button>
          </div>
        )}
      </div>

      {/* ADICIONAR NOVO (APENAS ADMIN) */}
      {isAdding && isAdmin && (
         <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3"><UserPlus size={18} className="text-primary" /> Novo Recruta de Elite</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('upload-new').click()}>
                     <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                        <Camera size={32} />
                     </div>
                     <input id="upload-new" type="file" accept="image/*" className="hidden" />
                  </div>
                  <div>
                     <p className="text-white font-black text-sm uppercase italic">Foto de Perfil</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase">Novo Recrutamento</p>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificação</p>
                  <input type="text" placeholder="Nome Completo..." className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-primary/50" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
               </div>
               <div className="flex gap-2">
                  <button onClick={handleAddPlayer} className="flex-1 h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Alistar Agora</button>
                  <button onClick={() => setIsAdding(false)} className="px-6 h-14 bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] active:scale-95 transition-all">Cancelar</button>
               </div>
            </div>
         </div>
      )}

      {sections.map(liga => liga.d.length > 0 && (
        <div key={liga.t} className="space-y-5">
          <h3 className={`text-[11px] font-black ${liga.c} uppercase tracking-[0.3em] italic flex items-center gap-3 ml-2`}>
            <div className={`w-1 h-4 ${liga.c.replace('text', 'bg')} rounded-full`}></div> Liga {liga.t}
          </h3>
          <div className="grid grid-cols-1 gap-5">
            {liga.d.map((player) => (
              <MemberCard key={player.jogador_id} player={player} isAdmin={isAdmin} currentMonth={currentMonth} currentWeek={currentWeek} onComplete={fetchData} editingId={editingId} setEditingId={setEditingId} formData={formData} setFormData={setFormData} handleSave={handleSave} handleEdit={handleEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MemberCard = ({ player, isAdmin, currentMonth, currentWeek, onComplete, editingId, setEditingId, formData, setFormData, handleSave, handleEdit }) => {
  const [showExtra, setShowExtra] = useState(false);
  const [extra, setExtra] = useState({ valor: '5.00', motivo: 'MULTA', desc: '' });
  const [saving, setSaving] = useState(false);

  const toggleMonthly = async () => {
    if (!isAdmin) return alert('Operação Reservada ao Comandante! 🏮⚡');
    setSaving(true);
    try {
      const isPaid = player.mensalidade_paga;
      const { error } = await supabase.from('mensalidades').upsert({ 
        jogador_id: player.jogador_id, 
        mes: currentMonth, 
        pago: !isPaid, 
        data_pagamento: !isPaid ? new Date().toISOString() : null, 
        valor_pago: 5.00 
      }, { onConflict: 'jogador_id,mes' });
      
      if (error) throw error;
      if (!isPaid) await supabase.from('banca_transacoes').insert({ 
        jogador_id: player.jogador_id, 
        tipo: 'MENSALIDADE', 
        valor: 5.00, 
        descricao: `Mensalidade ${currentMonth}` 
      });
      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveExtra = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('banca_transacoes').insert({ 
        jogador_id: player.jogador_id, 
        tipo: extra.motivo, 
        valor: extra.motivo === 'LEVANTAMENTO' ? -Math.abs(extra.valor) : Math.abs(extra.valor), 
        descricao: extra.desc || 'Extra', 
        semana: currentWeek 
      });
      if (error) throw error;
      setShowExtra(false);
      alert('Banca Master: OK! 🔥');
      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${player.jogador_id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
       const filePath = `membros/${fileName}`;
       const { error: uploadError } = await supabase.storage.from('fotos_perfil').upload(filePath, file);
       if (uploadError) throw uploadError;
       const { data: { publicUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(filePath);
       setFormData({ ...formData, foto_url: publicUrl });

       // UTILIZADOR TAMBÉM PODE CARREGAR FOTO (AUTO-SAVE)
       const { error: dbError } = await supabase.from('jogadores').update({ foto_url: publicUrl }).eq('id', player.jogador_id);
       if (dbError) throw dbError;
       alert('Foto Actualizada! 📸');
       if (onComplete) await onComplete();
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setSaving(false); }
  };

  const IsEditing = editingId === player.jogador_id;

  return (
    <div className={`relative bg-slate-900 border-2 rounded-[32px] p-6 shadow-2xl transition-all duration-300 ${IsEditing ? 'border-primary ring-4 ring-primary/5 bg-slate-900/95' : 'border-white/5 hover:bg-slate-900/80 hover:border-white/10'}`}>
      {IsEditing ? (
        <div className="space-y-6">
           <div className="flex items-center gap-4 mb-2">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById(`upload-${player.jogador_id}`).click()}>
                 <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                    {saving ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                 </div>
                 <input id={`upload-${player.jogador_id}`} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              <div>
                 <h4 className="text-white font-black text-sm uppercase italic tracking-widest leading-none">Editar Perfil</h4>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Utilizador can access photo & name</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                    <span>Nome de Guerra</span>
                    {!isAdmin && <span className="text-rose-500/50 flex items-center gap-1"><AlertCircle size={10} /> Bloqueado</span>}
                 </p>
                 <input type="text" className={`w-full h-14 bg-slate-950 border rounded-2xl px-5 text-sm font-black outline-none transition-all ${!isAdmin ? 'text-slate-600 border-white/5 opacity-50 cursor-not-allowed' : 'text-white border-white/10 focus:border-primary/50'}`} value={formData.nome} onChange={(e) => isAdmin && setFormData({...formData, nome: e.target.value})} readOnly={!isAdmin} />
              </div>

              {/* LIGAS: APENAS ADMIN PODE TROCAR (Bloqueio Elite) */}
              {isAdmin && (
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Classificação das Ligas (ADMIN ONLY)</p>
                   <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-white/5 h-14 items-center">
                      <button type="button" onClick={() => setFormData({...formData, liga_atual: 'Norte'})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${formData.liga_atual === 'Norte' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-slate-400'}`}>NORTE</button>
                      <button type="button" onClick={() => setFormData({...formData, liga_atual: null})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${formData.liga_atual === null ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-600 hover:text-slate-400'}`}>AUTO</button>
                      <button type="button" onClick={() => setFormData({...formData, liga_atual: 'Sul'})} className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${formData.liga_atual === 'Sul' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-600 hover:text-slate-400'}`}>SUL</button>
                   </div>
                </div>
              )}
           </div>

           <div className="flex gap-3 pt-3 border-t border-white/5">
              <button onClick={() => handleSave(player.jogador_id)} className="flex-1 h-14 bg-primary text-slate-950 rounded-[24px] font-black uppercase text-[11px] tracking-widest transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center gap-2"><Save size={16} /> Gravar Perfil</button>
              <button onClick={() => setEditingId(null)} className="px-6 h-14 bg-slate-800 text-slate-400 rounded-[20px] font-black uppercase text-[10px] active:scale-95 transition-all">Sair</button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-white/5 shadow-2xl bg-slate-950 flex-shrink-0 relative">
               {player.foto_url ? <img src={player.foto_url} className="w-full h-full object-cover" alt={player.nome} /> : <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-2xl italic">{player.nome.substring(0,2)}</div>}
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="min-w-0 flex-1">
               <h4 className="text-white font-black text-xl italic uppercase tracking-tighter leading-tight truncate">{player.nome}</h4>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-0.5">{player.liga_atual || 'Estatuto Auto'}</p>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-white/5">
              {/* UTILIZADORES PODEM EDITAR A SUA FOTO/NOME */}
              <button onClick={() => handleEdit(player)} className="flex-1 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-primary transition-all active:scale-90 outline-none"><Settings2 size={20} /></button>
              
              <button onClick={toggleMonthly} disabled={saving} className={`flex-1 h-12 rounded-2xl flex items-center justify-center transition-all outline-none active:scale-90 shadow-lg ${player.mensalidade_paga ? 'bg-emerald-500 text-slate-900 border-none' : 'bg-slate-950 text-rose-500 border border-rose-500/20 animate-pulse'}`}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={22} />}
              </button>
              
              <button onClick={() => isAdmin && setShowExtra(!showExtra)} className={`flex-1 h-12 rounded-2xl flex items-center justify-center transition-all outline-none active:scale-90 ${!isAdmin ? 'opacity-20 grayscale pointer-events-none' : ''} ${showExtra ? 'bg-primary text-slate-900 border-none shadow-[0_0_20px_rgba(255,200,0,0.3)]' : 'bg-slate-950 border border-primary/20 text-primary'}`}><PlusCircle size={22} /></button>
          </div>

          {showExtra && isAdmin && (
            <div className="animate-in slide-in-from-top-4 duration-300 bg-primary/5 border border-primary/10 rounded-3xl p-5 w-full">
               <div className="grid grid-cols-2 gap-3 mb-3">
                  <select value={extra.motivo} onChange={e => setExtra({...extra, motivo: e.target.value})} className="bg-slate-950 border border-white/10 rounded-2xl px-3 h-12 text-[10px] font-black text-white outline-none">
                    <option value="MULTA">MULTA</option>
                    <option value="PREMIO">PRÉMIO</option>
                    <option value="LEVANTAMENTO">SAÍDA</option>
                  </select>
                  <div className="relative h-12">
                    <input type="number" value={extra.valor} onChange={e => setExtra({...extra, valor: e.target.value})} className="w-full h-full bg-slate-950 border border-white/10 rounded-2xl px-3 text-xs font-black text-white outline-none pl-6"/>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">€</span>
                  </div>
               </div>
               <div className="flex gap-3">
                  <input type="text" placeholder="Motivo/Sócio..." value={extra.desc} onChange={e => setExtra({...extra, desc: e.target.value})} className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 text-[10px] h-12 text-white outline-none font-bold"/>
                  <button onClick={handleSaveExtra} disabled={saving} className="bg-primary text-slate-950 px-6 h-12 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 active:scale-95">OK</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Membros;