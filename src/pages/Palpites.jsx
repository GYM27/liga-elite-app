import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Check, X, Share2, Search, Trophy, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BatchOCRModal from '../components/BatchOCRModal';

const Palpites = () => {
  const { isAdmin } = useAdmin();
  const { ranking, allPalpites, currentWeek, loading, fetchData, idsNorte = [], idsSul = [], equipas = [] } = useDashboardData();
  const [betStatus, setBetStatus] = useState({});
  const [ocrModal, setOcrModal] = useState({ open: false, league: '', players: [] });

  useEffect(() => {
    const initialStatus = {};
    (allPalpites || []).forEach(p => {
      const nome = p.jogadores?.nome;
      if (nome) {
        if (p.resultado_individual === 'GREEN') initialStatus[nome] = 'G';
        if (p.resultado_individual === 'RED') initialStatus[nome] = 'R';
      }
    });
    setBetStatus(initialStatus);
  }, [allPalpites]);

  const jogadoresNorte = ranking.filter(j => idsNorte.includes(j.jogador_id));
  const jogadoresSul = ranking.filter(j => idsSul.includes(j.jogador_id));

  const palpiteMap = (allPalpites || []).reduce((acc, p) => {
    acc[p.jogador_id] = p;
    return acc;
  }, {});

  const handleBetUI = (jogadorId, nome, tipo) => {
    if (!isAdmin) return;
    setBetStatus(prev => ({ ...prev, [nome]: tipo }));
  };

  const generateReport = () => {
    const sortedNorte = jogadoresNorte.map(j => ({ nome: j.nome, status: betStatus[j.nome] }));
    const sortedSul = jogadoresSul.map(j => ({ nome: j.nome, status: betStatus[j.nome] }));
    const fmt = (list) => list.map(l => `${l.status === 'G' ? '🟢' : l.status === 'R' ? '🔴' : '🟡'} ${l.nome}`).join('\n');
    let report = `🏆 *LIGA DE ELITE - S${currentWeek}*\n\n🔥 *NORTE:*\n${fmt(sortedNorte)}\n\n🌍 *SUL:*\n${fmt(sortedSul)}\n\n_Gerado na Elite Bet_`;
    navigator.clipboard.writeText(report);
    alert('Relatório semanal copiado!');
  };

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs tracking-widest text-primary italic">Sintonizando Satélites...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12 pb-10 px-2 max-w-lg mx-auto">
      <div className="mb-6 flex justify-between items-center px-2">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic drop-shadow-2xl">
          Aba <span className="text-primary tracking-widest">Palpites</span>
        </h2>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Semana {currentWeek}</span>
        </div>
      </div>

      {isAdmin && (
        <button onClick={generateReport} className="w-full flex items-center justify-center gap-3 h-16 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all shadow-2xl active:scale-95 outline-none">
           <Share2 size={20} className="text-primary" /> Copiar Resultados WhatsApp
        </button>
      )}

      <div className="space-y-16">
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4 border-l-4 border-blue-400 py-1">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Liga Norte</h3>
             {isAdmin && (
                <button onClick={() => setOcrModal({ open: true, league: 'Liga Norte', players: jogadoresNorte })} className="text-[10px] font-black uppercase text-blue-400 bg-blue-400/5 px-4 py-2 rounded-xl border border-blue-400/20 active:scale-90 outline-none transition-all">Importar Print</button>
             )}
           </div>
           <div className="grid grid-cols-1 gap-6">
             {jogadoresNorte.map((jogador, index) => (
               <PlayerCard key={jogador.jogador_id} jogador={jogador} status={betStatus[jogador.nome]} onBet={handleBetUI} isAdmin={isAdmin} initialData={palpiteMap[jogador.jogador_id]} currentWeek={currentWeek} rank={index + 1} onComplete={fetchData} teamsPool={equipas} />
             ))}
           </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-white/5">
           <div className="flex justify-between items-center px-4 border-l-4 border-orange-400 py-1">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Liga Sul</h3>
             {isAdmin && (
                <button onClick={() => setOcrModal({ open: true, league: 'Liga Sul', players: jogadoresSul })} className="text-[10px] font-black uppercase text-orange-400 bg-orange-400/5 px-4 py-2 rounded-xl border border-orange-400/20 active:scale-90 outline-none transition-all">Importar Print</button>
             )}
           </div>
           <div className="grid grid-cols-1 gap-6">
             {jogadoresSul.map((jogador, index) => (
               <PlayerCard key={jogador.jogador_id} jogador={jogador} status={betStatus[jogador.nome]} onBet={handleBetUI} isAdmin={isAdmin} initialData={palpiteMap[jogador.jogador_id]} currentWeek={currentWeek} rank={index + 7} onComplete={fetchData} teamsPool={equipas} />
             ))}
           </div>
        </section>
      </div>

      <BatchOCRModal isOpen={ocrModal.open} onClose={() => setOcrModal({ ...ocrModal, open: false })} leagueName={ocrModal.league} players={ocrModal.players} currentWeek={currentWeek} onComplete={fetchData} existingPalpites={palpiteMap} />
    </div>
  );
};

// COMPONENTE DE INPUT COM AUTOCOMPLETE UNIFORMIZADO
const TeamAutocomplete = ({ label, value, onChange, teamsPool, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.length >= 3) {
      const filtered = teamsPool.filter(t => t.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
      setSuggestions(filtered);
      setShow(true);
    } else { setShow(false); }
  };

  const selectTeam = (team) => { onChange(team); setShow(false); };

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">{label}</p>
      <div className="relative h-14">
        <input type="text" placeholder={placeholder} value={value} onChange={handleTextChange} onFocus={() => { if(value.length >= 3) setShow(true); }} className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-5 text-xs font-black text-white focus:outline-none focus:border-primary/40 placeholder:text-slate-800 uppercase shadow-inner outline-none transition-all" />
        {show && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300">
             {suggestions.map((s, idx) => (
               <button key={idx} onClick={() => selectTeam(s)} className="w-full text-left px-4 h-12 rounded-xl text-[10px] font-black text-slate-300 hover:bg-primary/20 hover:text-white uppercase transition-colors flex items-center gap-2 outline-none"><Search size={12} className="text-primary" /> {s}</button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PlayerCard = ({ jogador, status, onBet, isAdmin, initialData, currentWeek, rank, onComplete, teamsPool }) => {
  const [details, setDetails] = useState({ ec: '', ef: '', ap: '', odd: '', nb: true });
  const [saving, setSaving] = useState(false);
  const isPending = !initialData;

  useEffect(() => {
    if (initialData) {
      setDetails({ 
        ec: initialData.equipa_casa || '', ef: initialData.equipa_fora || '', 
        ap: initialData.aposta || '', odd: initialData.odd || '', nb: initialData.no_bilhete ?? true 
      });
    }
  }, [initialData]);

  const saveToDB = async (novoTipo = null) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const finalStatus = novoTipo || (status === 'G' ? 'GREEN' : status === 'R' ? 'RED' : 'PENDENTE');
      const { error } = await supabase.from('palpites').upsert({
          jogador_id: jogador.jogador_id, semana: currentWeek, resultado_individual: finalStatus,
          equipa_casa: details.ec, equipa_fora: details.ef, jogo: `${details.ec} vs ${details.ef}`,
          aposta: details.ap, odd: details.odd ? Number(details.odd) : null,
          data_palpite: new Date().toISOString().split('T')[0],
          liga_no_momento: rank <= 6 ? 'Norte' : 'Sul'
      }, { onConflict: 'jogador_id,semana' });
      if (error) throw error;
      alert('Golo! Palpite Gravado! 🔥');
      if (onComplete) await onComplete();
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleInstantBet = async (tipo) => {
     const nextStatus = (status === tipo) ? 'PENDENTE' : (tipo === 'G' ? 'GREEN' : 'RED');
     onBet(jogador.jogador_id, jogador.nome, (status === tipo) ? undefined : tipo);
     await saveToDB(nextStatus);
  };

  return (
    <div className={`relative overflow-hidden bg-slate-900 border-2 p-6 rounded-[40px] shadow-2xl transition-all duration-500 min-h-[460px] flex flex-col justify-between ${isPending ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/5'}`}>
      
      <div className="flex justify-between items-center mb-8 px-1">
        <div className="flex items-center gap-5 flex-1 min-w-0">
           <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-3xl overflow-hidden border-2 border-white/10 shadow-3xl bg-slate-950">
                {jogador.foto_url ? <img src={jogador.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-black italic">{jogador.nome.substring(0,2)}</div>}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-950 border border-white/20 rounded-xl flex items-center justify-center text-[11px] font-black text-primary italic shadow-2xl">#{rank}</div>
           </div>
           <div className="min-w-0 flex-1">
              <h4 className="text-lg font-display font-black text-white uppercase italic tracking-tight leading-none truncate">{jogador.nome}</h4>
           </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
           <button onClick={() => handleInstantBet('G')} disabled={saving} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 outline-none active:scale-90 ${status === 'G' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-950 text-emerald-500 border border-emerald-500/10'}`}><Check size={24} strokeWidth={4} /></button>
           <button onClick={() => handleInstantBet('R')} disabled={saving} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 outline-none active:scale-90 ${status === 'R' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-slate-950 text-rose-500 border border-rose-500/10'}`}><X size={24} strokeWidth={4} /></button>
        </div>
      </div>

      <div className="space-y-5 flex-1">
         <TeamAutocomplete label="Equipa da Casa" value={details.ec} onChange={val => setDetails({...details, ec: val})} teamsPool={teamsPool} placeholder="Ex: FC Porto" />
         <TeamAutocomplete label="Equipa de Fora" value={details.ef} onChange={val => setDetails({...details, ef: val})} teamsPool={teamsPool} placeholder="Ex: Sporting CP" />
         
         <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">Aposta & Odd</p>
            <div className="grid grid-cols-[1fr_85px] gap-3 h-14">
               <input type="text" placeholder="Qual a aposta?" value={details.ap} onChange={e => setDetails({...details, ap: e.target.value})} className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-5 text-xs font-black text-white focus:outline-none uppercase shadow-inner outline-none transition-all placeholder:text-slate-800" />
               <input type="text" placeholder="1.80" value={details.odd} onChange={e => setDetails({...details, odd: e.target.value})} className="w-full h-full bg-slate-950 border border-white/5 rounded-2xl px-2 text-xs font-black text-primary text-center focus:outline-none shadow-inner outline-none transition-all" />
            </div>
         </div>
      </div>

      <div className="pt-8">
         <button onClick={() => saveToDB()} disabled={saving || !isAdmin} className="w-full h-16 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] italic bg-primary text-slate-950 shadow-2xl active:scale-95 transition-all outline-none border-b-4 border-black/20">{saving ? 'A GUARDAR...' : 'Guardar Palpite 🔥'}</button>
      </div>
    </div>
  );
};

export default Palpites;
