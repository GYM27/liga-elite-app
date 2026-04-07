import React, { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { supabase } from "../lib/supabaseClient";
import {
  UserPlus,
  Trash2,
  Camera,
  User,
  X,
  Wallet,
  MessageCircle,
  Loader2,
  Settings2,
  RefreshCw,
  Link,
} from "lucide-react";

const Membros = () => {
  const { isAdmin } = useAdmin();
  const {
    ranking,
    loading,
    fetchData,
    currentMonth,
    currentWeek,
    reorganizeLigas,
  } = useDashboardData();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    foto_url: "",
    liga_atual: "Norte",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (player) => {
    setEditingId(player.jogador_id);
    setFormData({
      nome: player.nome,
      foto_url: player.foto_url || "",
      liga_atual: player.liga_atual || "Norte",
    });
  };

  const handleSave = async (id) => {
    try {
      const updateData = isAdmin
        ? {
            nome: formData.nome,
            foto_url: formData.foto_url,
            liga_atual: formData.liga_atual,
          }
        : { foto_url: formData.foto_url };

      // Correção: Usar 'id' que corresponde à chave primária na tabela jogadores
      const { error } = await supabase
        .from("jogadores")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      alert("Perfil Atualizado! 🚀");
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const handleAddPlayer = async () => {
    if (!formData.nome) return;
    try {
      const { error } = await supabase.from("jogadores").insert([
        {
          nome: formData.nome,
          foto_url: formData.foto_url,
          liga_atual: formData.liga_atual,
        },
      ]);
      if (error) throw error;
      alert("Recruta Alistado! 🏁");
      setIsAdding(false);
      setFormData({ nome: "", foto_url: "", liga_atual: "Norte" });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const generateGlobalReport = () => {
    const pagos = ranking.filter((p) => !p.em_divida).map((p) => ` ${p.nome}`);
    const emFalta = ranking
      .filter((p) => p.em_divida)
      .map((p) => ` ${p.nome} ${p.motivo_divida}`);
    let report = ` LIGA DE ELITE Semana ${currentWeek}  \n📅 *ESTADO GERAL*\n\n *PAGOS:* \n${pagos.length > 0 ? pagos.join("\n") : "_Nenhum_ "}\n\n *EM DÍVIDA:* \n${emFalta.length > 0 ? emFalta.join("\n") : "_Nenhum_"}\n\n`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
  };

  const sections = React.useMemo(() => [
    {
      t: "Norte",
      d: ranking.filter((p) => p.liga_atual === "Norte"),
      c: "text-blue-400",
    },
    {
      t: "Sul",
      d: ranking.filter((p) => p.liga_atual === "Sul"),
      c: "text-orange-400",
    },
    {
      t: "AUTO / FORA",
      d: ranking.filter((p) => !p.liga_atual),
      c: "text-emerald-400",
    },
  ], [ranking]);

  if (loading)
    return (
      <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs">
        Recrutando Elite...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-2 max-w-lg mx-auto">
      <div className="mb-4 flex justify-between items-center px-1 pt-4 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <User className="text-primary" size={28} />
          <span>
            Membros{" "}
            <span className="text-primary tracking-widest text-xl">Elite</span>
          </span>
        </h2>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() =>
                window.confirm(
                  "Deseja reorganizar as Ligas automaticamente?",
                ) && reorganizeLigas()
              }
              className="w-12 h-12 bg-blue-500 text-slate-950 rounded-2xl flex items-center justify-center active:rotate-180 transition-all duration-500 shadow-xl"
              title="Auto-Reorganizar Ligas"
            >
              <RefreshCw size={22} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={generateGlobalReport}
            className="w-12 h-12 bg-emerald-500 text-slate-900 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
          >
            <MessageCircle size={22} strokeWidth={3} />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="w-12 h-12 bg-primary text-slate-950 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xl"
          >
            <UserPlus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
            <UserPlus size={18} className="text-primary" /> Novo Recruta
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome do Membro"
              className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddPlayer}
                className="flex-1 h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[11px] active:scale-95"
              >
                Alistar
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-6 h-14 bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] active:scale-95"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {sections.map(
        (liga) =>
          liga.d.length > 0 && (
            <div key={liga.t} className="space-y-5 text-left">
              <h3
                className={`text-[11px] font-black ${liga.c} uppercase tracking-[0.3em] italic flex items-center gap-3 ml-2`}
              >
                <div
                  className={`w-1 h-4 ${liga.c.replace("text", "bg")} rounded-full`}
                ></div>{" "}
                Liga {liga.t}
              </h3>
              <div className="grid grid-cols-1 gap-5">
                {liga.d.map((player) => (
                  <MemberCard
                    key={player.jogador_id}
                    player={player}
                    isAdmin={isAdmin}
                    currentMonth={currentMonth}
                    onComplete={fetchData}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    formData={formData}
                    setFormData={setFormData}
                    handleSave={handleSave}
                    handleEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
};

const MemberCard = ({
  player,
  isAdmin,
  currentMonth,
  onComplete,
  editingId,
  setEditingId,
  formData,
  setFormData,
  handleSave,
  handleEdit,
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [photoMode, setPhotoMode] = useState('file'); // 'file' | 'url'
  const [photoUrl, setPhotoUrl] = useState('');

  const MESES_EPOCA = [
    "Junho 2025",
    "Julho 2025",
    "Agosto 2025",
    "Setembro 2025",
    "Outubro 2025",
    "Novembro 2025",
    "Dezembro 2025",
    "Janeiro 2026",
    "Fevereiro 2026",
    "Março 2026",
    "Abril 2026",
  ];

  const handleLiquidateDebt = async (debt) => {
    if (!isAdmin) return;
    setStatusMsg({ t: "LIQUIDANDO DÍVIDA...", c: "text-amber-500 animate-pulse" });
    try {
      // 1. Marcar transação como paga
      const { error: tErr } = await supabase
        .from("banca_transacoes")
        .update({ pago: true })
        .eq("id", debt.id);
      if (tErr) throw tErr;

      // 2. Adicionar dinheiro ao banco (ja que foi liquidada)
      const { data: bP } = await supabase
        .from("banca_particoes")
        .select("banco_valor")
        .eq("id", 1)
        .maybeSingle();
      if (bP) {
        await supabase
          .from("banca_particoes")
          .update({ banco_valor: (Number(bP.banco_valor) || 0) + Number(debt.valor) })
          .eq("id", 1);
      }

      setStatusMsg({
        t: "DÍVIDA LIQUIDADA! 💰✅",
        c: "text-emerald-500 font-bold",
      });
      if (onComplete) onComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    }
  };

  const handlePay = async (month) => {
    if (!isAdmin) return;
    setStatusMsg({ t: "PROCESSANDO...", c: "text-primary animate-pulse" });
    try {
      await supabase.from("banca_transacoes").insert([
        {
          valor: 5.0,
          tipo: "MENSALIDADE",
          descricao: `Mensalidade ${month} - ${player.nome}`,
          pago: true,
          jogador_id: player.jogador_id,
          created_at: new Date(),
        },
      ]);
      const { error: mErr } = await supabase
        .from("mensalidades")
        .upsert(
          { jogador_id: player.jogador_id, mes: month, pago: true },
          { onConflict: "jogador_id,mes" },
        );
      if (mErr) throw mErr;

      const { data: bP } = await supabase
        .from("banca_particoes")
        .select("banco_valor")
        .eq("id", 1)
        .maybeSingle();
      if (bP)
        await supabase
          .from("banca_particoes")
          .update({ banco_valor: (Number(bP.banco_valor) || 0) + 5.0 })
          .eq("id", 1);

      setStatusMsg({
        t: "PAGO COM SUCESSO! 🏁",
        c: "text-emerald-500 font-bold",
      });
      if (onComplete) onComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    }
  };

  const handleUnpay = async (e, month) => {
    if (!isAdmin) return;
    e.stopPropagation();
    setStatusMsg({ t: "ANULANDO...", c: "text-rose-400 animate-pulse" });
    try {
      await supabase
        .from("mensalidades")
        .upsert(
          { jogador_id: player.jogador_id, mes: month, pago: false },
          { onConflict: "jogador_id,mes" },
        );
      const { data: bP } = await supabase
        .from("banca_particoes")
        .select("banco_valor")
        .eq("id", 1)
        .maybeSingle();
      if (bP)
        await supabase
          .from("banca_particoes")
          .update({ banco_valor: (Number(bP.banco_valor) || 0) - 5.0 })
          .eq("id", 1);

      await supabase
        .from("banca_transacoes")
        .delete()
        .eq("jogador_id", player.jogador_id)
        .eq("tipo", "MENSALIDADE")
        .like("descricao", `%${month}%`);

      setStatusMsg({
        t: "ANULAÇÃO CONCLUÍDA! 🏮",
        c: "text-rose-500 font-bold",
      });
      if (onComplete) onComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const fileName = `${player.jogador_id}-${Math.random().toString(36).substring(7)}`;
      const filePath = `membros/${fileName}`;

      // PASSO 1: Upload para o Storage
      const { error: uploadErr } = await supabase.storage.from("fotos").upload(filePath, file);
      if (uploadErr) throw new Error("Erro no upload: " + uploadErr.message);

      // PASSO 2: Obter URL pública
      const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Não foi possível obter o URL da foto.");

      // PASSO 3: Gravar URL no jogador
      const { error: dbErr } = await supabase
        .from("jogadores")
        .update({ foto_url: publicUrl })
        .eq("id", player.jogador_id);
      if (dbErr) throw new Error("Erro ao gravar URL: " + dbErr.message);

      // SINCRONIZAR ESTADO LOCAL PARA O BOTÃO "GRAVAR" NÃO SOBREPOR
      setFormData(prev => ({ ...prev, foto_url: publicUrl }));

      if (onComplete) await onComplete();
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const IsEditing = editingId === player.jogador_id;

  return (
    <div
      className={`relative bg-slate-900 border-2 rounded-[32px] p-6 transition-all duration-300 ${IsEditing ? "border-primary ring-4 ring-primary/5" : "border-white/5"}`}
    >
      {IsEditing ? (
        <div className="space-y-6 text-left">
          {/* FOTO — TOGGLE FILE / URL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-xs uppercase italic">Foto de Perfil</p>
              <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
                <button
                  onClick={() => setPhotoMode('file')}
                  className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${
                    photoMode === 'file' ? 'bg-primary text-slate-950' : 'text-slate-500'
                  }`}
                >
                  <Camera size={10} /> Ficheiro
                </button>
                <button
                  onClick={() => setPhotoMode('url')}
                  className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[9px] font-black uppercase transition-all ${
                    photoMode === 'url' ? 'bg-primary text-slate-950' : 'text-slate-500'
                  }`}
                >
                  <Link size={10} /> URL
                </button>
              </div>
            </div>

            {photoMode === 'file' ? (
              <div
                className="h-14 bg-slate-950 border border-white/10 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => document.getElementById(`upload-${player.jogador_id}`).click()}
              >
                {saving ? <Loader2 className="animate-spin text-primary" size={20} /> : <Camera size={20} className="text-slate-500" />}
                <span className="text-[10px] font-black text-slate-500 uppercase italic">Clica para carregar imagem</span>
                <input id={`upload-${player.jogador_id}`} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="flex-1 h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-[10px] font-black text-white outline-none focus:border-primary/40 transition-all"
                />
                <button
                  onClick={async () => {
                    if (!photoUrl.trim()) return;
                    setSaving(true);
                    try {
                      console.log("🔍 A tentar gravar foto...");
                      console.log("   jogador_id:", player.jogador_id);
                      console.log("   URL:", photoUrl.trim());
                      const { data, error, status } = await supabase
                        .from('jogadores')
                        .update({ foto_url: photoUrl.trim() })
                        .eq('id', player.jogador_id)
                        .select();
                      console.log("📡 Resposta Supabase - status:", status);
                      console.log("📡 data:", data);
                      console.log("📡 error:", error);
                      if (error) throw error;
                      
                      // SINCRONIZAR ESTADO LOCAL PARA O BOTÃO "GRAVAR" NÃO SOBREPOR
                      setFormData(prev => ({ ...prev, foto_url: photoUrl.trim() }));
                      
                      if (!data || data.length === 0) {
                        console.warn("⚠️ 0 rows afetados! ID pode não corresponder.");
                      }
                      setPhotoUrl('');
                      setPhotoMode('file');
                      if (onComplete) await onComplete();
                    } catch (err) {
                      alert('❌ ' + err.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !photoUrl.trim()}
                  className="h-14 px-4 bg-primary text-slate-950 rounded-2xl font-black text-[9px] uppercase active:scale-95 transition-all disabled:opacity-40"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <input
              type="text"
              className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
            />
            <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-white/5 h-12 items-center">
              <button
                onClick={() =>
                  setFormData({ ...formData, liga_atual: "Norte" })
                }
                className={`flex-1 h-8 rounded-lg text-[9px] font-black uppercase ${formData.liga_atual === "Norte" ? "bg-blue-500 text-white" : "text-slate-600"}`}
              >
                NORTE
              </button>
              <button
                onClick={() => setFormData({ ...formData, liga_atual: null })}
                className={`flex-1 h-8 rounded-lg text-[9px] font-black uppercase ${formData.liga_atual === null ? "bg-emerald-500 text-slate-950" : "text-slate-600"}`}
              >
                AUTO
              </button>
              <button
                onClick={() => setFormData({ ...formData, liga_atual: "Sul" })}
                className={`flex-1 h-8 rounded-lg text-[9px] font-black uppercase ${formData.liga_atual === "Sul" ? "bg-orange-500 text-white" : "text-slate-600"}`}
              >
                SUL
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(player.jogador_id)}
              className="flex-1 h-12 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[10px]"
            >
              Gravar
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="px-6 h-12 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px]"
            >
              Sair
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 text-left">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 shadow-2xl bg-slate-950 border-white/5 relative">
              {player.foto_url?.trim() ? (
                <img
                  src={player.foto_url}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center text-slate-700 font-black text-2xl italic absolute inset-0"
                style={{ display: player.foto_url?.trim() ? 'none' : 'flex' }}
              >
                {player.nome.substring(0, 2)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-black text-xl italic uppercase truncate leading-tight">
                {player.nome}
              </h4>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 text-slate-500">
                {player.liga_atual || "Estatuto Auto"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => handleEdit(player)}
              className="flex-1 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white shadow-md"
            >
              <Settings2 size={22} />
            </button>
            <button
              onClick={() => {
                setShowAuditModal(true);
                setStatusMsg(null);
              }}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border border-emerald-500/20 text-emerald-500 shadow-lg"
            >
              <Wallet size={22} />
            </button>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-primary/10 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4">
                  Auditória de Membro
                </h3>
                <p className="text-2xl font-black text-white italic truncate mt-2 leading-tight">
                  {player.nome}
                </p>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            {statusMsg && (
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 text-center">
                <p
                  className={`text-[11px] font-black uppercase tracking-widest ${statusMsg.c}`}
                >
                  {statusMsg.t}
                </p>
                <button
                  onClick={() => setStatusMsg(null)}
                  className="mt-2 text-[8px] font-black text-slate-500 uppercase underline"
                >
                  Fechar Aviso
                </button>
              </div>
            )}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide py-2">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] italic underline">
                Dívidas / Multas Pendentes
              </p>
              
              {(player.dividas_pendentes || []).length === 0 && (
                <p className="text-[10px] text-slate-500 italic">Sem multas em aberto.</p>
              )}

              {(player.dividas_pendentes || []).map((debt) => (
                <div
                    key={debt.id}
                    className="w-full bg-slate-950 border border-amber-500/20 p-5 rounded-[32px] flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase italic">
                        {debt.descricao || "Atraso/Dívida"}
                      </p>
                      <p className="text-2xl font-black text-amber-500">{Number(debt.valor).toFixed(2)}€</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleLiquidateDebt(debt)}
                        className="bg-amber-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase ml-2 active:scale-95"
                      >
                        LIQUIDAR
                      </button>
                    )}
                </div>
              ))}

              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] italic underline mt-6">
                Mensalidades Pendentes
              </p>
              {MESES_EPOCA.map((m) => {
                const isPaid = player.historico_mensalidades?.[m];
                if (isPaid) return null;
                return (
                  <div
                    key={m}
                    className="w-full bg-slate-950 border border-rose-500/20 p-5 rounded-[32px] flex justify-between items-center"
                  >
                    <div>
                      <p className="text-[10px] font-black text-white uppercase italic">
                        {m}
                      </p>
                      <p className="text-2xl font-black text-rose-500">5.00€</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handlePay(m)}
                        className="bg-emerald-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase"
                      >
                        LIQUIDAR
                      </button>
                    )}
                  </div>
                );
              })}
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic underline mt-6">
                Histórico Pago
              </p>
              {MESES_EPOCA.map((m) => {
                const isPaid = player.historico_mensalidades?.[m];
                if (!isPaid) return null;
                return (
                  <div
                    key={m}
                    className="w-full bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center"
                  >
                    <span className="text-[10px] font-black text-emerald-400 uppercase italic">
                      {m} ✅
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleUnpay(e, m)}
                        className="text-rose-500 text-[10px] font-black underline flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Anular
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membros;
