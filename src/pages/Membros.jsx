import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Save, Trash2, Camera, User, AlertCircle, Coins } from 'lucide-react';

const Membros = () => {
  const { isAdmin } = useAdmin();
  const { ranking, loading, fetchData } = useDashboardData();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', foto_url: '', liga_atual: 'Norte', divida: 0, motivo_divida: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (player) => {
    if (!isAdmin) return;
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
      const currentPlayer = ranking.find(p => p.jogador_id === id);
      const { error } = await supabase.from('jogadores').update({
        nome: formData.nome,
        foto_url: formData.foto_url,
        liga_atual: formData.liga_atual,
        divida: Number(String(formData.divida).replace(',', '.')),
        motivo_divida: formData.motivo_divida
      }).eq('id', id);
      
      if (error) throw error;
      
      alert('Perfil e Dívidas atualizados!');
      setEditingId(null);
      window.location.reload();
    } catch (err) {
      alert('Erro ao guardar');
    }
  };

  const handleResetAll = async () => {
    if(!confirm('Isto vai limpar as ligas fixas. Continuar?')) return;
    try {
      const { error } = await supabase.from('jogadores').update({ liga_atual: null }).neq('nome', ''); 
      if (error) throw error;
      window.location.reload();
    } catch (err) { alert('Erro no Reset'); }
  };

  const handleAddMember = async () => {
    if (!formData.nome) return alert('O nome é obrigatório');
    try {
      const { error } = await supabase.from('jogadores').insert([{
          nome: formData.nome,
          foto_url: formData.foto_url,
          liga_atual: formData.liga_atual,
          divida: 0,
          motivo_divida: ''
      }]);
      if (error) throw error;
      alert('Novo membro adicionado!');
      setIsAdding(false);
      window.location.reload();
    } catch (err) { alert('Erro ao adicionar'); }
  };

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs">Convocando a Elite...</div>;

  const idsNorte = ranking.filter((p, i) => p.liga_atual === 'Norte' || (p.liga_atual === null && i < 6)).map(p => p.jogador_id);
  const playersNorte = ranking.filter(j => idsNorte.includes(j.jogador_id));
  const playersSul = ranking.filter(j => !idsNorte.includes(j.jogador_id));

  const MemberCard = ({ player }) => {
    const isNorte = idsNorte.includes(player.jogador_id);
    const hasDebt = (player.divida || 0) > 0;

    return (
      <div className={`bg-slate-800/40 border rounded-[32px] p-5 shadow-xl transition-all ${editingId === player.jogador_id ? 'border-primary ring-4 ring-primary/10' : 'border-white/5 hover:bg-slate-800/60'}`}>
        {editingId === player.jogador_id ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 italic">Identificação</p>
                  <input type="text" className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:border-primary/50 outline-none" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
               </div>
               
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 italic">Gestão de Dívida 💰</p>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <input type="text" placeholder="0,00" className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl px-4 py-3 text-rose-500 font-black text-lg focus:border-rose-500 outline-none" value={formData.divida} onChange={(e) => setFormData({...formData, divida: e.target.value})} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500/40 font-bold">€</span>
                     </div>
                     <input type="text" placeholder="Motivo (Ex: Multa S14)" className="flex-[2] bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:border-primary/50 outline-none" value={formData.motivo_divida} onChange={(e) => setFormData({...formData, motivo_divida: e.target.value})} />
                  </div>
               </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 italic">Posicionamento na Liga</p>
              <div className="flex gap-2 p-1 bg-slate-950/40 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setFormData({...formData, liga_atual: 'Norte'})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${formData.liga_atual === 'Norte' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>NORTE</button>
                <button type="button" onClick={() => setFormData({...formData, liga_atual: null})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${formData.liga_atual === null ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>AUTO</button>
                <button type="button" onClick={() => setFormData({...formData, liga_atual: 'Sul'})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${formData.liga_atual === 'Sul' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>SUL</button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleSave(player.jogador_id)} className="flex-[2] bg-primary text-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"><Save size={18} /> Guardar Alterações</button>
              <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-white/5 shadow-2xl">
                  {player.foto_url ? <img src={player.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700 font-display font-black text-xl">{player.nome.substring(0,2)}</div>}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl border-4 border-slate-800 flex items-center justify-center text-white shadow-xl ${isNorte ? 'bg-blue-500' : 'bg-orange-500'}`}>
                  <span className="text-[10px] font-black">#{ranking.indexOf(player) + 1}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-display font-black text-xl italic uppercase group-hover:text-primary transition-colors">{player.nome}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${isNorte ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-orange-500/30 text-orange-400 bg-orange-500/5'}`}>{isNorte ? 'Elite Norte' : 'Elite Sul'}</span>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{player.total_greens} Acertos</span>
                </div>

                {hasDebt && (
                  <div className="mt-3 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-2xl animate-pulse">
                     <Coins size={14} className="text-rose-500 mt-0.5" />
                     <div>
                        <p className="text-[11px] font-black text-rose-500 leading-none">{player.divida}€ Pendente</p>
                        <p className="text-[9px] font-bold text-rose-500/60 uppercase tracking-tighter mt-1 italic">{player.motivo_divida || 'Dívida Diversa'}</p>
                     </div>
                  </div>
                )}
              </div>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => handleEdit(player)} 
                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 rounded-2xl transition-all shadow-inner group"
              >
                 <Coins size={20} className="group-hover:animate-bounce" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-10">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
             <User className="text-primary" size={32} />
             <span>Membros <span className="text-primary tracking-widest uppercase text-xl">Elite</span></span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1">Controlo de Atletas & Finanças</p>
        </div>
        
        {isAdmin && (
           <div className="flex gap-2">
              <button onClick={() => setIsAdding(true)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-primary/20 hover:text-primary transition-all"><UserPlus size={20} /></button>
           </div>
        )}
      </div>

      {isAdding && (
         <div className="animate-in zoom-in-95 duration-200 bg-slate-800/40 border border-primary/20 rounded-[32px] p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Recrutar Novo Atleta Elite</h3>
            <input type="text" placeholder="Nome Completo" className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-4 text-white font-bold" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            <div className="flex gap-2">
               <button onClick={() => setFormData({...formData, liga_atual: 'Norte'})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase border ${formData.liga_atual === 'Norte' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 text-slate-600'}`}>NORTE</button>
               <button onClick={() => setFormData({...formData, liga_atual: 'Sul'})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase border ${formData.liga_atual === 'Sul' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-900 text-slate-600'}`}>SUL</button>
            </div>
            <button onClick={handleAddMember} className="w-full bg-primary text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Confirmar Recrutamento</button>
            <button onClick={() => setIsAdding(false)} className="w-full text-slate-500 font-black uppercase text-[10px] tracking-widest py-2">Cancelar</button>
         </div>
      )}

      <div className="space-y-6">
        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2 ml-2">
           <div className="w-1 h-4 bg-blue-400 rounded-full"></div> Liga Norte
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {playersNorte.map((player) => <MemberCard key={player.jogador_id} player={player} />)}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest italic flex items-center gap-2 ml-2">
           <div className="w-1 h-4 bg-orange-400 rounded-full"></div> Liga Sul
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {playersSul.map((player) => <MemberCard key={player.jogador_id} player={player} />)}
        </div>
      </div>

      {isAdmin && (
        <div className="pt-10 border-t border-white/5 space-y-4">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic text-center">Ferramentas de Manutenção Elite</p>
           <div className="flex gap-4">
              <button onClick={() => fetchData()} className="flex-1 py-4 rounded-2xl bg-slate-800/40 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 transition-all">Forçar Sincronização de Ranks</button>
              <button onClick={handleResetAll} className="flex-1 py-4 rounded-2xl bg-slate-800/40 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-rose-500/20 hover:text-rose-500 transition-all">Limpar Ligas Fixas (Reset)</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Membros;
