import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "../context/AdminContext";
import { useDashboardData } from "../hooks/useDashboardData";
import {
  Check,
  X,
  Share2,
  Search,
  Trophy,
  Clock,
  AlertCircle,
  Info,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BatchOCRModal from "../components/BatchOCRModal";
import { useEliteTime } from "../hooks/useEliteTime";

const Palpites = () => {
  // 1. IMPORTANTE: Usamos o isAdmin do contexto para ser igual ao resto do site
  const { isAdmin } = useAdmin();
  const {
    ranking,
    fullHistory,
    currentWeek,
    availableWeeks,
    loading,
    fetchData,
    updatePalpiteResult,
    idsNorte = [],
    idsSul = [],
    equipas = [],
  } = useDashboardData();

  const [selectedWeek, setSelectedWeek] = useState(null);
  const { weekNumber } = useEliteTime();

  const [ocrModal, setOcrModal] = useState({
    open: false,
    league: "",
    players: [],
  });

  // Sincroniza a semana selecionada com a semana atual da DB ao carregar
  useEffect(() => {
    if (currentWeek && !selectedWeek) setSelectedWeek(currentWeek);
  }, [currentWeek]);

  if (loading)
    return (
      <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs tracking-widest text-primary italic">
        Auditando Registos...
      </div>
    );

  // Define qual a semana que estamos a visualizar
  const viewWeek = selectedWeek || currentWeek;

  // Filtra palpites e organiza por jogador
  const weekPalpitesRaw = (fullHistory || []).filter(
    (p) => Number(p.semana) === Number(viewWeek),
  );

  const palpiteMap = weekPalpitesRaw.reduce((acc, p) => {
    acc[p.jogador_id] = p;
    return acc;
  }, {});

  const jogadoresNorte = ranking.filter((j) => idsNorte.includes(j.jogador_id));
  const jogadoresSul = ranking.filter((j) => idsSul.includes(j.jogador_id));

  const generateReport = () => {
    // 1. Garante que temos a semana correta
    const vWeek = selectedWeek || currentWeek;

    // Função que formata a lista com os emojis BONITOS
    const fmt = (list) =>
      list
        .map((j) => {
          const p = palpiteMap[j.jogador_id];

          // Normalização do resultado (GREEN, RED, PENDING)
          const res = p?.resultado_individual?.toUpperCase();

          // Usamos os emojis Círculos Coloridos (🟢, 🔴, 🟡)
          let icon = "🟡"; // Default: Pendente (Amarelo)
          if (res === "GREEN") icon = "🟢"; // Acerto (Verde)
          if (res === "RED") icon = "🔴"; // Falha (Vermelho)

          return `${icon} ${j.nome}`;
        })
        .join("\n");

    // 2. CONSTRUÇÃO DO RELATÓRIO PREMIUM (com todos os emojis e quebras de linha)
    const reportHTML =
      `🏆 *LIGA DE ELITE - S${vWeek}*\n\n` +
      `🔥 *NORTE:*\n${fmt(jogadoresNorte)}\n\n` +
      `🌍 *SUL:*\n${fmt(jogadoresSul)}\n\n` +
      `_RUMO ÀS GREENS_`;

    navigator.clipboard.writeText(reportHTML).then(() => {});

    // 4. ABRIR O WHATSAPP (Apenas com uma mensagem de instrução simples)
    // Desta forma, a URL é leve e está blindada contra o erro "?"
    const instructionText = `🏆 LIGA DE ELITE`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(instructionText)}`;

    // Abrir o WhatsApp
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12 pb-10 px-2 max-w-lg mx-auto text-left">
      {/* SELETOR DE SEMANAS */}
      <div className="mt-10 flex flex-col items-center">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 italic">
          Linha Temporal
        </label>
        <div className="relative group w-full max-w-xs text-left">
          <select
            value={viewWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="w-full h-16 bg-slate-900 border-2 border-white/5 rounded-[24px] px-8 text-sm font-black text-white appearance-none outline-none focus:border-primary/40 transition-all cursor-pointer shadow-2xl uppercase tracking-widest text-center italic"
          >
            {(availableWeeks || []).map((w) => (
              <option
                key={w}
                value={w}
                className="bg-slate-900 text-white font-black"
              >
                Semana {w} {w === weekNumber ? " (ATUAL) 🔥" : ""}
              </option>
            ))}
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-30 group-hover:opacity-100 transition-opacity">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center px-2 pt-6">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <Clock className="text-primary" size={28} />
          <span className="text-primary tracking-widest uppercase">
            Palpites
          </span>
        </h2>
      </div>

      {/* BOTÃO DE RELATÓRIO - Agora visível se isAdmin for true */}
      {isAdmin && (
        <button
          onClick={generateReport}
          className="w-full h-16 rounded-3xl bg-slate-900 border-2 border-white/5 text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-950 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl"
        >
          <Share2 size={18} className="text-primary" /> Relatório Semanal
          WhatsApp
        </button>
      )}

      <div className="space-y-16">
        {/* LIGA NORTE */}
        <section className="space-y-8">
          <div className="flex justify-between items-center px-4 border-l-4 border-blue-400 py-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
              Liga Norte
            </h3>
            {isAdmin && Number(viewWeek) === Number(currentWeek) && (
              <button
                onClick={() =>
                  setOcrModal({
                    open: true,
                    league: "Liga Norte",
                    players: jogadoresNorte,
                  })
                }
                className="text-[9px] font-black uppercase text-blue-400 bg-blue-400/5 px-4 py-2 rounded-xl border border-blue-400/20 transition-all active:scale-90"
              >
                Importar Print
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8">
            {jogadoresNorte.map((j, idx) => (
              <PlayerCard
                key={j.jogador_id}
                jogador={j}
                isAdmin={isAdmin}
                initialData={palpiteMap[j.jogador_id]}
                week={viewWeek}
                rank={idx + 1}
                onComplete={fetchData}
                teamsPool={equipas}
                updateResult={updatePalpiteResult}
              />
            ))}
          </div>
        </section>

        {/* LIGA SUL */}
        <section className="space-y-8 pt-10 border-t border-white/5">
          <div className="flex justify-between items-center px-4 border-l-4 border-orange-400 py-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
              Liga Sul
            </h3>
            {isAdmin && Number(viewWeek) === Number(currentWeek) && (
              <button
                onClick={() =>
                  setOcrModal({
                    open: true,
                    league: "Liga Sul",
                    players: jogadoresSul,
                  })
                }
                className="text-[9px] font-black uppercase text-orange-400 bg-orange-400/5 px-4 py-2 rounded-xl border border-orange-400/20 transition-all active:scale-90"
              >
                Importar Print
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8">
            {jogadoresSul.map((j, idx) => (
              <PlayerCard
                key={j.jogador_id}
                jogador={j}
                isAdmin={isAdmin}
                initialData={palpiteMap[j.jogador_id]}
                week={viewWeek}
                rank={idx + 7}
                onComplete={fetchData}
                teamsPool={equipas}
                updateResult={updatePalpiteResult}
              />
            ))}
          </div>
        </section>
      </div>

      <BatchOCRModal
        isOpen={ocrModal.open}
        onClose={() => setOcrModal({ ...ocrModal, open: false })}
        leagueName={ocrModal.league}
        players={ocrModal.players}
        currentWeek={viewWeek}
        onComplete={fetchData}
        existingPalpites={palpiteMap}
      />
    </div>
  );
};

// --- COMPONENTE TEAM AUTOCOMPLETE ---
const TeamAutocomplete = ({
  label,
  value,
  onChange,
  teamsPool,
  placeholder,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.length >= 3) {
      const filtered = teamsPool
        .filter((t) => t.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 10);
      setSuggestions(filtered);
      setShow(true);
    } else {
      setShow(false);
    }
  };

  const selectTeam = (team) => {
    onChange(team);
    setShow(false);
  };

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">
        {label}
      </p>
      <div className="relative h-14">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleTextChange}
          onFocus={() => {
            if (value.length >= 3) setShow(true);
          }}
          className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-5 text-xs font-black text-white focus:outline-none focus:border-primary/40 placeholder:text-slate-800 uppercase shadow-inner outline-none transition-all"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => selectTeam(s)}
                className="w-full text-left px-4 h-12 rounded-xl text-[10px] font-black text-slate-300 hover:bg-primary/20 hover:text-white uppercase transition-colors flex items-center gap-2 outline-none"
              >
                <Search size={12} className="text-primary" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PLAYER CARD ---
const PlayerCard = ({
  jogador,
  isAdmin,
  initialData,
  week,
  rank,
  onComplete,
  teamsPool,
  updateResult,
}) => {
  const [details, setDetails] = useState({
    ec: "",
    ef: "",
    ap: "",
    odd: "",
    nb: true,
  });
  const [saving, setSaving] = useState(false);
  const isPending = !initialData;
  const currentResult = initialData?.resultado_individual;

  const loggedUser = localStorage.getItem("user_name") || "";
  const isOwner = loggedUser.toLowerCase() === jogador.nome.toLowerCase();
  const canEdit = isAdmin || (isOwner && isPending);

  useEffect(() => {
    if (initialData) {
      setDetails({
        ec: initialData.equipa_casa || "",
        ef: initialData.equipa_fora || "",
        ap: initialData.aposta || "",
        odd: initialData.odd || "",
        nb: initialData.no_bilhete ?? true,
      });
    } else {
      setDetails({ ec: "", ef: "", ap: "", odd: "", nb: true });
    }
  }, [initialData, week]);

  const saveToDB = async (novoTipo = null) => {
    if (!canEdit && !novoTipo) return;
    if (!isAdmin && novoTipo) return;

    setSaving(true);
    try {
      const finalStatus = novoTipo || currentResult || "PENDENTE";
      const { error } = await supabase.from("palpites").upsert(
        {
          jogador_id: jogador.jogador_id,
          semana: week,
          resultado_individual: finalStatus,
          equipa_casa: details.ec,
          equipa_fora: details.ef,
          jogo: `${details.ec} vs ${details.ef}`,
          aposta: details.ap,
          odd: details.odd ? Number(details.odd) : null,
          data_palpite: new Date().toISOString().split("T")[0],
          liga_no_momento: rank <= 6 ? "Norte" : "Sul",
        },
        { onConflict: "jogador_id,semana" },
      );
      if (error) throw error;
      if (!novoTipo) alert("Golo! Palpite Gravado! 🔥");
      if (onComplete) await onComplete();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInstantBet = async (tipo) => {
    if (!isAdmin) return;
    const nextStatus = currentResult === tipo ? "PENDENTE" : tipo;
    await saveToDB(nextStatus);
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 border-2 p-6 rounded-[40px] shadow-2xl transition-all duration-500 min-h-[460px] flex flex-col justify-between ${isPending ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-white/5"}`}
    >
      <div className="flex justify-between items-center mb-8 px-1">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-3xl overflow-hidden border-2 border-white/10 shadow-3xl bg-slate-950">
              {jogador.foto_url ? (
                <img
                  src={jogador.foto_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-black italic">
                  {jogador.nome.substring(0, 2)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-950 border border-white/20 rounded-xl flex items-center justify-center text-[11px] font-black text-primary italic shadow-2xl">
              #{rank}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-display font-black text-white uppercase italic tracking-tight leading-none truncate">
              {jogador.nome}
            </h4>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleInstantBet("GREEN")}
              disabled={saving}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 outline-none active:scale-90 ${currentResult === "GREEN" ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-950 text-emerald-500 border border-emerald-500/10"}`}
            >
              <Check size={24} strokeWidth={4} />
            </button>
            <button
              onClick={() => handleInstantBet("RED")}
              disabled={saving}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 outline-none active:scale-90 ${currentResult === "RED" ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "bg-slate-950 text-rose-500 border border-rose-500/10"}`}
            >
              <X size={24} strokeWidth={4} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5 flex-1">
        <div className={!canEdit ? "opacity-50 pointer-events-none" : ""}>
          <TeamAutocomplete
            label="Equipa da Casa"
            value={details.ec}
            onChange={(val) => setDetails({ ...details, ec: val })}
            teamsPool={teamsPool}
            placeholder="Ex: FC Porto"
          />
          <TeamAutocomplete
            label="Equipa de Fora"
            value={details.ef}
            onChange={(val) => setDetails({ ...details, ef: val })}
            teamsPool={teamsPool}
            placeholder="Ex: Sporting CP"
          />
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">
              Aposta & Odd
            </p>
            <div className="grid grid-cols-[1fr_85px] gap-3 h-14">
              <input
                type="text"
                placeholder="Qual a aposta?"
                value={details.ap}
                onChange={(e) => setDetails({ ...details, ap: e.target.value })}
                className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-5 text-xs font-black text-white focus:outline-none uppercase shadow-inner transition-all placeholder:text-slate-800"
              />
              <input
                type="text"
                placeholder="1.80"
                value={details.odd}
                onChange={(e) =>
                  setDetails({ ...details, odd: e.target.value })
                }
                className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-2 text-xs font-black text-primary text-center focus:outline-none shadow-inner transition-all"
              />
            </div>
          </div>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in duration-500">
            <AlertCircle size={14} className="text-amber-500" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Bilhete Bloqueado. Contacta o Comandante.
            </p>
          </div>
        )}
      </div>

      <div className="pt-8">
        {canEdit ? (
          <button
            onClick={() => saveToDB()}
            disabled={saving}
            className="w-full h-16 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] italic bg-primary text-slate-950 shadow-2xl active:scale-95 transition-all outline-none border-b-4 border-black/20"
          >
            {saving ? "A GUARDAR..." : "Guardar Palpite 🔥"}
          </button>
        ) : (
          <div className="w-full h-16 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] italic bg-slate-900 border-2 border-white/5 text-slate-600 flex items-center justify-center gap-3">
            <Check size={18} className="text-emerald-500/30" /> Palpite
            Registado
          </div>
        )}
      </div>
    </div>
  );
};

export default Palpites;
