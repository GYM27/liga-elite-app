import React, { useState, useEffect } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useAdmin } from "../context/AdminContext";
import {
  ArrowLeft,
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  X,
  Check,
  AlertCircle,
  UserCheck,
  Download,
  Zap,
  Calendar,
  MessageSquare,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Estatisticas = () => {
  const navigate = useNavigate();
  const {
    nortePalpites,
    sulPalpites,
    loading,
    fetchData,
    currentWeek,
    ranking,
    stats,
  } = useDashboardData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // NOVO: Controla a aba do histórico
  const { isAdmin } = useAdmin();

  const [formData, setFormData] = useState({
    valor: "",
    tipo: "ENTRADA",
    descricao: "",
    pago: true,
    jogador_id: "",
  });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const monthsList = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const formattedMonthGlobal = `${monthsList[now.getMonth()]} ${now.getFullYear()}`;

  const provisionWeeklyFines = async (currentRanking, week) => {
    if (!isAdmin || !currentRanking || currentRanking.length === 0 || !week) return;
    
    const today = new Date();
    if (today.getDay() < 2 && today.getDay() !== 0) return; // Só Terça (2) em diante (Domingo=0)

    try {
      // 1. Obter quais membros já têm multa nesta semana (para não duplicar)
      const { data: multasExistentes } = await supabase
        .from("banca_transacoes")
        .select("jogador_id")
        .eq("tipo", "MULTA")
        .like("descricao", `%Atraso s${week}%`);
      
      const idsComMulta = new Set((multasExistentes || []).map(m => m.jogador_id));

      // 2. Verificar quem não submeteu palpites
      const { data: palpitesSemana } = await supabase
        .from("palpites")
        .select("jogador_id")
        .eq("semana", week);
      
      const idsComPalpites = new Set((palpitesSemana || []).map(p => p.jogador_id));

      const novosDevedores = currentRanking
        .filter(p => !idsComPalpites.has(p.jogador_id) && !idsComMulta.has(p.jogador_id))
        .map(p => ({
          valor: 1.00,
          tipo: "MULTA",
          descricao: `Multa Atraso s${week}`,
          pago: false,
          jogador_id: p.jogador_id,
          created_at: new Date().toISOString()
        }));

      if (novosDevedores.length > 0) {
        console.log("🏮 Gerando multas automáticas:", novosDevedores.length);
        await supabase.from("banca_transacoes").insert(novosDevedores);
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao provisionar multas:", err);
    }
  };

  const provisionMonthlyDebts = async (currentRanking) => {
    if (!currentRanking || currentRanking.length === 0) return;
    try {
      const { data: existencias } = await supabase
        .from("mensalidades")
        .select("jogador_id")
        .eq("mes", formattedMonthGlobal);
      const idsPagos = new Set((existencias || []).map((e) => e.jogador_id));
      const novosRegistos = currentRanking
        .filter((p) => !idsPagos.has(p.jogador_id))
        .map((p) => ({
          jogador_id: p.jogador_id,
          mes: formattedMonthGlobal,
          pago: false,
        }));
      if (novosRegistos.length > 0) {
        await supabase.from("mensalidades").insert(novosRegistos);
        fetchData();
      }
    } catch (err) {
      console.error("Erro Provisionamento:", err);
    }
  };

  useEffect(() => {
    if (!loading && ranking.length > 0) {
      provisionMonthlyDebts(ranking);
      provisionWeeklyFines(ranking, currentWeek);
    }
  }, [loading, ranking.length, currentWeek]);

  const handlePayMonthly = async (player, monthLabel) => {
    if (!isAdmin) return;
    setStatusMsg({ t: "PROCESSANDO...", c: "text-primary animate-pulse" });
    try {
      const { error: tErr } = await supabase.from("banca_transacoes").insert([
        {
          valor: 5.0,
          tipo: "MENSALIDADE",
          descricao: `Mensalidade ${monthLabel} - ${player.nome}`,
          jogador_id: player.jogador_id,
          pago: true, // FIXED: Marca como liquidado na banca
          created_at: new Date().toISOString(),
        },
      ]);

      const { error: mErr } = await supabase.from("mensalidades").upsert(
        {
          jogador_id: player.jogador_id,
          mes: monthLabel,
          pago: true,
        },
        { onConflict: "jogador_id,mes" },
      );

      if (mErr || tErr) {
        setStatusMsg({
          t: "ERRO: " + (mErr?.message || tErr?.message),
          c: "text-rose-500",
        });
        return;
      }

      const { data: bP } = await supabase
        .from("banca_particoes")
        .select("banco_valor")
        .eq("id", 1)
        .maybeSingle();
      if (bP) {
        await supabase
          .from("banca_particoes")
          .update({ banco_valor: (Number(bP.banco_valor) || 0) + 5.0 })
          .eq("id", 1);
      }

      setStatusMsg({
        t: "PAGO COM SUCESSO! 🏁",
        c: "text-emerald-500 font-bold",
      });
      fetchData();
    } catch (err) {
      setStatusMsg({ t: "CRASH: " + err.message, c: "text-rose-500" });
    }
  };

  const handleUnpayMonthly = async (player, monthLabel) => {
    if (!isAdmin) return;
    setStatusMsg({ t: "ANULANDO...", c: "text-rose-400 animate-pulse" });
    setSaving(true);
    try {
      const { error: mErr } = await supabase.from("mensalidades").upsert(
        {
          jogador_id: player.jogador_id,
          mes: monthLabel,
          pago: false,
        },
        { onConflict: "jogador_id,mes" },
      );

      if (mErr) {
        setStatusMsg({ t: "ERRO: " + mErr.message, c: "text-rose-500" });
        return;
      }

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
        .like("descricao", `%${monthLabel}%`);

      setStatusMsg({
        t: "ANULAÇÃO CONCLUÍDA! 🏮",
        c: "text-rose-500 font-bold",
      });
      await fetchData();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    } finally {
      setSaving(false);
    }
  };

  const handlePayDebt = async (debt) => {
    if (!isAdmin) return;
    setStatusMsg({ t: "LIQUIDANDO...", c: "text-primary animate-pulse" });
    try {
      await supabase
        .from("banca_transacoes")
        .update({ pago: true })
        .eq("id", debt.id);
      const { data: bP } = await supabase
        .from("banca_particoes")
        .select("banco_valor")
        .eq("id", 1)
        .maybeSingle();
      if (bP)
        await supabase
          .from("banca_particoes")
          .update({
            banco_valor: (Number(bP.banco_valor) || 0) + Math.abs(debt.valor),
          })
          .eq("id", 1);

      setStatusMsg({
        t: "LIQUIDADO COM SUCESSO! ✅",
        c: "text-emerald-500 font-bold",
      });
      await fetchData();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!isAdmin) return;
    if (!window.confirm("Deseja ANULAR esta dívida/multa permanentemente?")) return;
    
    setStatusMsg({ t: "ANULANDO DÍVIDA...", c: "text-rose-500 animate-pulse" });
    try {
      const { error } = await supabase
        .from("banca_transacoes")
        .delete()
        .eq("id", debtId);
      
      if (error) throw error;
      
      setStatusMsg({ t: "DÍVIDA ANULADA! 🏮🏁", c: "text-rose-500 font-bold" });
      await fetchData();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.valor || !formData.descricao) return;
    setSaving(true);
    const amount = Number(formData.valor.replace(",", "."));
    try {
      const { error: tError } = await supabase.from("banca_transacoes").insert([
        {
          valor: amount,
          tipo: formData.tipo,
          descricao: formData.descricao,
          jogador_id: formData.jogador_id || null,
          pago: formData.pago, // FIXED: Agora envia o estado pago/pendente correto
          created_at: new Date().toISOString(),
        },
      ]);
      if (tError) throw tError;
      if (formData.pago) {
        const { data: bP } = await supabase
          .from("banca_particoes")
          .select("banco_valor")
          .eq("id", 1)
          .maybeSingle();
        if (bP)
          await supabase
            .from("banca_particoes")
            .update({
              banco_valor:
                (Number(bP.banco_valor) || 0) +
                (formData.tipo === "SAIDA" ? -amount : amount),
            })
            .eq("id", 1);
      }
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShareGlobalReport = () => {
    const texto = ` *LIGA DE ELITE* \n *Relatório Abril 2026*\n\n *PAGOS:*\n${ranking
      .filter((p) => !p.em_divida)
      .map((p) => ` • ${p.nome}`)
      .join("\n")}\n\n *DÍVIDAS:*\n${ranking
      .filter((p) => p.em_divida)
      .map((p) => ` • ${p.nome}`)
      .join("\n")}\n\n ELITE 🛡️⚡`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20 font-black uppercase text-xs tracking-widest italic">
        Sincronizando Elite...
      </div>
    );

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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10 max-w-lg mx-auto">
      <div className="text-center text-white text-sm font-black uppercase tracking-widest italic">
        {formattedMonthGlobal}
      </div>
      <div className="pt-4 px-2 flex justify-between items-center text-left">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-black text-white uppercase italic flex items-center justify-center gap-2">
            <PieChart className="text-primary" size={24} />
            <span>
              Tesouraria{" "}
              <span className="text-primary text-sm italic">Elite</span>
            </span>
          </h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary"
          >
            <PlusCircle size={20} />
          </button>
        )}
      </div>

      <section className="px-2 space-y-4 text-left">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
            <UserCheck size={22} /> MENSALIDADES{" "}
            {monthsList[now.getMonth()].toUpperCase()}
          </h3>
          <button
            onClick={handleShareGlobalReport}
            className="px-3 h-8 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[8px] font-black uppercase tracking-widest"
          >
            Enviar Relatório
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ranking.map((p) => (
            <button
              key={p.jogador_id}
              onClick={() => {
                setSelectedPlayer(p);
                setStatusMsg(null);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-[32px] bg-slate-900 border-2 transition-all active:scale-95 relative overflow-hidden group ${p.em_divida ? "border-rose-500" : "border-emerald-500"}`}
            >
              <div
                className={`w-12 h-12 rounded-full overflow-hidden border-2 mb-2 ${p.em_divida ? "border-rose-500/50" : "border-emerald-500/50"}`}
              >
                {p.foto_url ? (
                  <img
                    src={p.foto_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-500 uppercase">
                    {p.nome.substring(0, 2)}
                  </div>
                )}
              </div>
              <p
                className={`text-[10px] font-black uppercase text-center truncate w-full italic ${p.em_divida ? "text-rose-400" : "text-emerald-400"}`}
              >
                {p.nome.split(" ")[0]}
              </p>
              <div
                className={`absolute top-2 right-2 w-2 h-2 rounded-full ${p.em_divida ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
              ></div>
            </button>
          ))}
        </div>
      </section>

      <div className="px-2 text-left">
        <div className="bg-slate-900 border-2 border-primary/20 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div>
            <h4 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] mb-2 italic tracking-widest">
              Saldo em Caixa Real
            </h4>
            <p className="text-6xl font-display font-black text-white tracking-tighter italic">
              {stats.saldo.toFixed(2)}€
            </p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner shadow-primary/20">
            <Wallet size={32} />
          </div>
        </div>
      </div>

      <section className="px-2 space-y-4 text-left">
        {/* BOTÃO QUE ABRE/FECHA O HISTÓRICO */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex items-center justify-between px-1 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
              Histórico de Transações
            </h3>
          </div>
          {isHistoryOpen ? (
            <ChevronUp size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
        </button>

        {/* LISTA QUE SÓ APARECE SE isHistoryOpen FOR VERDADEIRO */}
        {isHistoryOpen && (
          <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {stats.transacoes
              ?.slice()
              .reverse()
              .slice(0, 5)
              .map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="bg-slate-900 border border-white/5 p-5 rounded-[32px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.pago ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                    >
                      {t.pago ? (
                        <TrendingUp size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white italic truncate max-w-[150px]">
                        {t.descricao}
                      </p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
                        {t.created_at
                          ? new Date(t.created_at).toLocaleDateString()
                          : "ELITE/2026"}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-display font-black tracking-tight ${t.pago ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {t.tipo === "ENTRADA" || t.tipo === "MENSALIDADE"
                      ? "+"
                      : "-"}
                    {Math.abs(t.valor).toFixed(2)}€
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>

      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm shadow-2xl">
          <div className="bg-slate-900 border-2 border-primary/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4 leading-loose">
                  Auditória de Membro
                </h3>
                <p className="text-2xl font-black text-white mt-1 uppercase italic truncate w-48">
                  {selectedPlayer.nome}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {statusMsg && (
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 animate-in zoom-in-95 duration-200 text-center">
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
              <div className="space-y-4">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] italic flex items-center gap-2 underline">
                  Pendências Elite
                </p>

                <div className="space-y-3">
                  {selectedPlayer.dividas_pendentes?.map((d) => (
                    <div
                      key={d.id}
                      className="w-full bg-white/5 border-2 border-rose-500/30 p-5 rounded-[32px] space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-white uppercase italic">
                            {d.descricao}
                          </p>
                          <p className="text-2xl font-display font-black text-rose-500">
                            {Math.abs(d.valor).toFixed(2)}€
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteDebt(d.id)}
                            className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-90"
                            title="Anular Multa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <button
                          onClick={() => handlePayDebt(d)}
                          className="w-full bg-emerald-500 text-slate-950 h-12 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> PAGAR / LIQUIDAR
                        </button>
                      )}
                    </div>
                  ))}
                  {MESES_EPOCA.map((m) => {
                    const isPaid = selectedPlayer.historico_mensalidades?.[m];
                    if (isPaid) return null;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePayMonthly(selectedPlayer, m);
                        }}
                        className="w-full p-5 rounded-[32px] border-2 bg-slate-950 border-rose-500/20 flex justify-between items-center transition-all active:scale-95"
                      >
                        <div>
                          <p className="text-[10px] font-black text-white uppercase italic">
                            {m}
                          </p>
                          <p className="text-2xl font-display font-black text-rose-400">
                            5.00€
                          </p>
                        </div>
                        {isAdmin ? (
                          <div className="bg-emerald-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            LIQUIDAR
                          </div>
                        ) : (
                          <div className="bg-emerald-500 text-slate-950 h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            PENDENTE
                          </div>
                        )}
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
          <div className="bg-slate-900 border-2 border-rose-500/20 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                <AlertCircle size={20} className="text-rose-500" /> Lançar Multa Elite
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-[9px] text-slate-500 uppercase font-black px-1 italic">
               As multas ficam pendentes no perfil do membro até serem liquidadas.
            </p>

            <form 
             onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.valor || !formData.descricao || !formData.jogador_id) return alert("Preenche todos os campos!");
                setSaving(true);
                const amount = Number(formData.valor.replace(",", "."));
                try {
                  const { error: tError } = await supabase.from("banca_transacoes").insert([
                    {
                      valor: amount,
                      tipo: "MULTA",
                      descricao: formData.descricao,
                      jogador_id: formData.jogador_id,
                      pago: false, // SEMPRE FALSO: Só soma ao banco ao liquidar no perfil
                      created_at: new Date().toISOString(),
                    },
                  ]);
                  if (tError) throw tError;
                  
                  setIsAddModalOpen(false);
                  setFormData({ valor: "", tipo: "ENTRADA", descricao: "", jogador_id: "", pago: true });
                  await fetchData();
                  alert("Multa registada! Aparecerá no perfil do membro. 🏮🏁");
                } catch (err) {
                  alert(err.message);
                } finally {
                  setSaving(false);
                }
             }} 
             className="space-y-5"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1">Membro Infrator</p>
                <select
                  value={formData.jogador_id}
                  onChange={(e) =>
                    setFormData({ ...formData, jogador_id: e.target.value })
                  }
                  className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-rose-500/30"
                >
                  <option value="">-- SELECIONAR MEMBRO --</option>
                  {ranking.map((p) => (
                    <option key={p.jogador_id} value={p.jogador_id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1 text-center">Valor (€)</p>
                  <input
                    type="text"
                    placeholder="1,00"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-2xl font-display font-black text-white text-center focus:border-rose-500/30"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1">Motivo / Descrição</p>
                  <input
                    type="text"
                    placeholder="Ex: Atraso s41"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-[11px] font-black text-white uppercase italic focus:border-rose-500/30 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-16 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-rose-500/20"
              >
                {saving ? "A LANÇAR..." : "CONFIRMAR MULTA 🏁"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estatisticas;
