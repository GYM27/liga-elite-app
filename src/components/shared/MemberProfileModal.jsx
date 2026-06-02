import React, { useState } from 'react';
import { Camera, Save, X as XIcon, Trash2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { EliteCard, EliteButton, EliteAvatar } from '../ui';

const MemberProfileModal = ({ player, onClose, isAdmin, onComplete }) => {
  const [formData, setFormData] = useState({
    nome: player.nome,
    foto_url: player.foto_url || '',
    liga_atual: player.liga_atual || 'Norte'
  });
  const [saving, setSaving] = useState(false);
  const [photoMode, setPhotoMode] = useState('file');

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

      setFormData(prev => ({ ...prev, foto_url: publicUrl }));
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = isAdmin 
        ? { nome: formData.nome, foto_url: formData.foto_url, liga_atual: formData.liga_atual } 
        : { foto_url: formData.foto_url };
        
      const { error } = await supabase.from("jogadores").update(updateData).eq("id", player.jogador_id);
      if (error) throw error;
      
      if (onComplete) await onComplete();
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Tens a certeza que queres expulsar ${player.nome} da Liga? Esta ação é irreversível.`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("jogadores").delete().eq("id", player.jogador_id);
      if (error) throw error;
      if (onComplete) await onComplete();
      onClose();
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm shadow-2xl animate-in fade-in duration-300">
      <EliteCard className="w-full max-w-sm p-6 space-y-6 shadow-2xl relative text-left" variant="default">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-white font-black text-xs uppercase tracking-widest italic">
            Perfil do Atleta
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <EliteAvatar src={formData.foto_url} name={formData.nome || player.nome} size="xl" />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Foto de Perfil</p>
              <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
                <button onClick={() => setPhotoMode('file')} className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${photoMode === 'file' ? 'bg-primary text-slate-950' : 'text-slate-500'}`}>Ficheiro</button>
                <button onClick={() => setPhotoMode('url')} className={`px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${photoMode === 'url' ? 'bg-primary text-slate-950' : 'text-slate-500'}`}>URL</button>
              </div>
            </div>

            {photoMode === 'file' ? (
              <label className="w-full h-16 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} /> {saving ? 'A SUBIR...' : 'Escolher Foto'}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={saving} />
              </label>
            ) : (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-xs text-white outline-none focus:border-primary/30"
                  value={formData.foto_url}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                />
                <LinkIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Nome de Guerra</p>
            <input 
              type="text" 
              className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-primary/30"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              readOnly={!isAdmin}
            />
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <p className="text-white font-black text-[10px] uppercase italic tracking-widest">Divisão Elite</p>
              <select 
                className="w-full h-12 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none"
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

        <div className="flex gap-2 pt-4">
          <EliteButton onClick={handleSave} icon={Save} className="flex-1" disabled={saving}>
            {saving ? 'A GRAVAR...' : 'GRAVAR PERFIL'}
          </EliteButton>
          {isAdmin && (
            <button 
              onClick={handleDelete}
              disabled={saving}
              className="w-12 flex-shrink-0 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </EliteCard>
    </div>
  );
};

export default MemberProfileModal;
