import React, { useState } from 'react';
import { Camera, Settings2, Trash2, Link as LinkIcon, Save, X as XIcon, MessageCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { EliteCard, EliteButton, EliteAvatar, EliteBadge } from '../ui';
import MemberAuditModal from './MemberAuditModal';

const MemberCard = ({ 
  player, 
  isAdmin, 
  onComplete,
  isEditing,
  onEdit,
  onCancel,
  formData,
  setFormData,
  handleSave 
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoMode, setPhotoMode] = useState('file'); // 'file' | 'url'

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const fileName = `${player.jogador_id}-${Math.random().toString(36).substring(7)}`;
      const filePath = `membros/${fileName}`;

      const { error: uploadErr } = await supabase.storage.from("fotos").upload(filePath, file);
      if (uploadErr) throw new Error("Erro no upload: " + uploadErr.message);

      const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Não foi possível obter o URL da foto.");

      const { error: dbErr } = await supabase
        .from("jogadores")
        .update({ foto_url: publicUrl })
        .eq("id", player.jogador_id);
      if (dbErr) throw new Error("Erro ao gravar URL: " + dbErr.message);

      setFormData(prev => ({ ...prev, foto_url: publicUrl }));
      if (onComplete) await onComplete();
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Tens a certeza que queres expulsar ${player.nome} da Liga? Esta ação é irreversível.`)) return;
    try {
      const { error } = await supabase.from("jogadores").delete().eq("id", player.jogador_id);
      if (error) throw error;
      if (onComplete) onComplete();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <EliteCard 
      variant={isEditing ? "primary" : player.em_divida ? "danger" : "default"}
      padding="p-0"
      className={`overflow-hidden transition-all duration-500 ${isEditing ? "ring-4 ring-primary/10" : "hover:border-white/10"}`}
    >
      {isEditing ? (
        <div className="p-6 space-y-6 text-left">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Foto de Perfil</p>
              <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
                <button onClick={() => setPhotoMode('file')} className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${photoMode === 'file' ? 'bg-primary text-slate-950' : 'text-slate-500'}`}>Ficheiro</button>
                <button onClick={() => setPhotoMode('url')} className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${photoMode === 'url' ? 'bg-primary text-slate-950' : 'text-slate-500'}`}>URL</button>
              </div>
            </div>

            {photoMode === 'file' ? (
              <label className="w-full h-32 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 transition-all">
                <Camera size={24} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{saving ? 'A SUBIR...' : 'Escolher Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={saving} />
              </label>
            ) : (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-xs text-white outline-none focus:border-primary/30"
                  value={formData.foto_url}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                />
                <LinkIcon size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Nome de Guerra</p>
              <input 
                type="text" 
                className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-primary/30"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Divisão Elite</p>
                <select 
                  className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none"
                  value={formData.liga_atual}
                  onChange={(e) => setFormData({ ...formData, liga_atual: e.target.value })}
                >
                  <option value="Norte">Norte (Elite)</option>
                  <option value="Sul">Sul (Elite)</option>
                  <option value="">Aposentado / Fora</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <EliteButton onClick={() => handleSave(player.jogador_id)} icon={Save} className="flex-1">Gravar Alterações</EliteButton>
            <EliteButton variant="secondary" onClick={onCancel} icon={XIcon} className="w-14" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Top Banner (Status Color) */}
          <div className={`h-1.5 w-full ${player.liga_atual === 'Norte' ? 'bg-blue-500' : player.liga_atual === 'Sul' ? 'bg-orange-500' : 'bg-slate-700'}`} />
          
          <div className="p-5 flex items-center gap-5 text-left relative">
            <div className="relative group/avatar">
              <EliteAvatar src={player.foto_url} name={player.nome} size="lg" inDebt={player.em_divida} />
              {player.em_divida && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse shadow-lg" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-black text-white uppercase italic truncate tracking-tight">{player.nome}</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <EliteBadge variant={player.liga_atual === 'Norte' ? 'primary' : player.liga_atual === 'Sul' ? 'warning' : 'default'} size="xs">
                  {player.liga_atual ? `LIGA ${player.liga_atual}` : 'SEM LIGA'}
                </EliteBadge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => onEdit(player)} 
                  className="w-9 h-9 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 transition-all active:scale-90"
                >
                  <Settings2 size={16} />
                </button>
                <button 
                  onClick={() => setShowAuditModal(true)} 
                  className="w-9 h-9 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-primary hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-90"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={handleDelete} 
                  className="w-9 h-19 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <MemberAuditModal 
          player={player} 
          isAdmin={isAdmin} 
          onClose={() => setShowAuditModal(false)} 
          onActionComplete={onComplete} 
        />
      )}
    </EliteCard>
  );
};

export default MemberCard;
