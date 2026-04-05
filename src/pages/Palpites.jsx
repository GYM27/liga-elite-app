import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "../context/AdminContext";
import { useDashboardData } from "../hooks/useDashboardData";
import {
  Check,
  X,
  Share2,
  Search,
  Clock,
  AlertCircle,
  ChevronDown,
  FastForward,
  RedoDot,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import BatchOCRModal from "../components/BatchOCRModal";
import { useEliteTime } from "../hooks/useEliteTime";

const Palpites = () => {
  const { isAdmin } = useAdmin();
  const {
    ranking,
    fullHistory,
    currentWeek,
    availableWeeks,
    loading,
    fetchData,
    updatePalpiteResult,
    advanceWeek,
    idsNorte = [],
    idsSul = [],
    equipas = [],
  } = useDashboardData();

  const [selectedWeek, setSelectedWeekRaw] = useState(() => {
    const saved = sessionStorage.getItem('elite_selected_week');
    return saved ? Number(saved) : null;
  });

  const setSelectedWeek = (w) => {
    setSelectedWeekRaw(w);
    if (w === null) sessionStorage.removeItem('elite_selected_week');
    else sessionStorage.setItem('elite_selected_week', String(w));
  };

  const { weekNumber } = useEliteTime();

  const [ocrModal, setOcrModal] = useState({
    open: false,
    league: "",
    players: [],
  });

  useEffect(() => {
    // Só define a semana atual se não houver nenhuma guardada
    if (currentWeek && !selectedWeek) setSelectedWeek(currentWeek);
  }, [currentWeek]);

  if (loading)
    return (
      <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs tracking-widest text-primary italic">
        Auditando Registos...
      </div>
    );

  const viewWeek = selectedWeek || currentWeek;

  const weekPalpitesRaw = (fullHistory || []).filter(
    (p) => Number(p.semana) === Number(viewWeek),
  );

  const palpiteMap = weekPalpitesRaw.reduce((acc, p) => {
    acc[p.jogador_id] = p;
    return acc;
  }, {});

  const jogadoresNorte = ranking.filter((j) => idsNorte.includes(j.jogador_id));
  const jogadoresSul = ranking.filter((j) => idsSul.includes(j.jogador_id));

  const handleAdvanceWeek = async () => {
    if (window.confirm(`Tens a certeza que queres encerrar a Semana ${currentWeek} e avançar?`)) {
      const result = await advanceWeek();
      if (result?.success) {
        alert(`Semana ${currentWeek} encerrada! 🔥\n⬆️ Promovidos: ${result.promovidos.map(p=>p.nome).join(', ') || 'Nenhum'}\n⬇️ Descidos: ${result.descidos.map(p=>p.nome).join(', ') || 'Nenhum'}`);
        setSelectedWeek(null);
      }
    }
  };

  const generateReport = () => {
    const vWeek = selectedWeek || currentWeek;
    const fmt = (list) =>
      list
        .map((j) => {
          const p = palpiteMap[j.jogador_id];
          const res = p?.resultado_individual?.toUpperCase();
          let icon = "🟡";
          if (res === "GREEN") icon = "🟢";
          if (res === "RED") icon = "🔴";
          return `${icon} ${j.nome}`;
        })
        .join("\n");

    const reportHTML =
      `🏆 *LIGA DE ELITE - S${vWeek}*\n\n` +
      `🔥 *NORTE:*\n${fmt(jogadoresNorte)}\n\n` +
      `🌍 *SUL:*\n${fmt(jogadoresSul)}\n\n` +
      `_RUMO ÀS GREENS_`;

    navigator.clipboard.writeText(reportHTML);
    window.open(
      `https://wa.me/?text=${encodeURIComponent("🏆 LIGA DE ELITE")}`,
      "_blank",
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12 pb-10 px-2 max-w-lg mx-auto text-left">
      {/* SELETOR DE SEMANAS E BOTÃO AVANÇAR */}
      <div className="mt-10 flex flex-col items-center">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 italic">
          Linha Temporal
        </label>
        <div className="flex gap-2 w-full max-w-xs">
          <div className="relative group flex-1">
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
                  Semana {w} {w === currentWeek ? " (ATUAL) 🔥" : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-30 group-hover:opacity-100 transition-opacity">
              <ChevronDown size={20} />
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleAdvanceWeek}
              className="w-16 h-16 bg-primary text-slate-950 rounded-[20px] flex items-center justify-center active:scale-90 transition-all shadow-xl border-b-4 border-black/20"
              title="Avançar Semana"
            >
              <FastForward size={24} fill="currentColor" />
            </button>
          )}
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

// Componentes Auxiliares
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
    } else setShow(false);
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
          onFocus={() => value.length >= 3 && setShow(true)}
          className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-5 text-xs font-black text-white focus:outline-none focus:border-primary/40 placeholder:text-slate-800 uppercase shadow-inner transition-all outline-none"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onChange(s);
                  setShow(false);
                }}
                className="w-full text-left px-4 h-12 rounded-xl text-[10px] font-black text-slate-300 hover:bg-primary/20 hover:text-white uppercase transition-colors flex items-center gap-2"
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
    } else setDetails({ ec: "", ef: "", ap: "", odd: "", nb: true });
  }, [initialData, week]);

  const saveToDB = async (novoTipo = null) => {
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
      if (onComplete) await onComplete();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`bg-slate-900 border-2 p-6 rounded-[40px] shadow-2xl flex flex-col ${isPending ? "border-amber-500/20" : "border-white/5"}`}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-950">
            {jogador.foto_url ? (
              <img
                src={jogador.foto_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                {jogador.nome.substring(0, 2)}
              </div>
            )}
          </div>
          <h4 className="text-lg font-black text-white uppercase italic truncate">
            {jogador.nome}
          </h4>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => saveToDB("GREEN")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentResult === "GREEN" ? "bg-emerald-500" : "bg-slate-950 text-emerald-500 border border-white/5"}`}
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => saveToDB("RED")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentResult === "RED" ? "bg-rose-500" : "bg-slate-950 text-rose-500 border border-white/5"}`}
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
      <div
        className={`space-y-4 ${!canEdit ? "opacity-50 pointer-events-none" : ""}`}
      >
        <TeamAutocomplete
          label="Casa"
          value={details.ec}
          onChange={(v) => setDetails({ ...details, ec: v })}
          teamsPool={teamsPool}
          placeholder="Equipa Casa"
        />
        <TeamAutocomplete
          label="Fora"
          value={details.ef}
          onChange={(v) => setDetails({ ...details, ef: v })}
          teamsPool={teamsPool}
          placeholder="Equipa Fora"
        />
        <div className="grid grid-cols-[1fr_80px] gap-2">
          <input
            type="text"
            placeholder="Aposta"
            value={details.ap}
            onChange={(e) => setDetails({ ...details, ap: e.target.value })}
            className="h-12 bg-slate-950 border border-white/5 rounded-xl px-4 text-xs text-white outline-none"
          />
          <input
            type="text"
            placeholder="Odd"
            value={details.odd}
            onChange={(e) => setDetails({ ...details, odd: e.target.value })}
            className="h-12 bg-slate-950 border border-white/5 rounded-xl px-2 text-xs text-primary text-center outline-none"
          />
        </div>
      </div>
      {canEdit && (
        <button
          onClick={() => saveToDB()}
          disabled={saving}
          className="mt-6 w-full h-12 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[10px] active:scale-95"
        >
          {saving ? "..." : "Gravar 🔥"}
        </button>
      )}
    </div>
  );
};

export default Palpites;
