import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Check, X, Share2, ClipboardList, AlertTriangle, Clock, Hash, Target, Trophy, PlusCircle, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BatchOCRModal from '../components/BatchOCRModal';

const Palpites = () => {
  const { isAdmin } = useAdmin();
  const { ranking, allPalpites, currentWeek, submissions, loading, fetchData, idsNorte = [], idsSul = [] } = useDashboardData();
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
    alert('Relatório copiado para o WhatsApp!');
  };

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs">Sintonizando Satélite...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex justify-between items-center">
          <span>Aba <span className="text-primary tracking-widest">Palpites</span></span>
          <span className="text-sm font-black bg-white/5 px-4 py-2 rounded-2xl border border-white/5 opacity-40">S{currentWeek}</span>
        </h2>
      </div>

      {isAdmin && (
        <button onClick={generateReport} className="w-full flex items-center justify-center gap-3 py-5 rounded-[32px] bg-white/5 border border-white/10 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition shadow-2xl">
           <Share2 size={18} className="text-primary animate-pulse" /> Relatório Semanal
        </button>
      )}

      <div className="space-y-12">
        <section className="space-y-6">
           <div className="flex justify-between items-center px-4 border-l-4 border-blue-400 py-1">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Liga Norte</h3>
             {isAdmin && (
                <button onClick={() => setOcrModal({ open: true, league: 'Liga Norte', players: jogadoresNorte })} className="text-[10px] font-black uppercase text-blue-400 bg-blue-400/10 px-4 py-2 rounded-xl border border-blue-400/20">Importar 📸</button>
             )}
           </div>
           <div className="grid grid-cols-1 gap-4">
             {jogadoresNorte.map((jogador, index) => (
               <PlayerCard 
                 key={jogador.jogador_id} 
                 jogador={jogador}
                 status={betStatus[jogador.nome]} 
                 onBet={handleBetUI} 
                 isAdmin={isAdmin} 
                 initialData={palpiteMap[jogador.jogador_id]}
                 currentWeek={currentWeek}
                 rank={index + 1}
                 onComplete={fetchData}
               />
             ))}
           </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-white/5">
           <div className="flex justify-between items-center px-4 border-l-4 border-orange-400 py-1">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Liga Sul</h3>
             {isAdmin && (
                <button onClick={() => setOcrModal({ open: true, league: 'Liga Sul', players: jogadoresSul })} className="text-[10px] font-black uppercase text-orange-400 bg-orange-400/10 px-4 py-2 rounded-xl border border-orange-400/20">Importar 📸</button>
             )}
           </div>
           <div className="grid grid-cols-1 gap-4">
             {jogadoresSul.map((jogador, index) => (
               <PlayerCard 
                 key={jogador.jogador_id} 
                 jogador={jogador}
                 status={betStatus[jogador.nome]} 
                 onBet={handleBetUI} 
                 isAdmin={isAdmin} 
                 initialData={palpiteMap[jogador.jogador_id]}
                 currentWeek={currentWeek}
                 rank={index + 7}
                 onComplete={fetchData}
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
        currentWeek={currentWeek}
        onComplete={fetchData}
        existingPalpites={palpiteMap}
      />
    </div>
  );
};

const PlayerCard = ({ jogador, status, onBet, isAdmin, initialData, currentWeek, rank, onComplete }) => {
  const [details, setDetails] = useState({ ec: '', ef: '', ap: '', odd: '', nb: true });
  const [saving, setSaving] = useState(false);
  const isPending = !initialData;

  useEffect(() => {
    if (initialData) {
      setDetails({ ec: initialData.equipa_casa || '', ef: initialData.equipa_fora || '', ap: initialData.aposta || '', odd: initialData.odd || '', nb: initialData.no_bilhete ?? true });
    }
  }, [initialData]);

  // Gravação Direta (Pelo Ícone ou Pelo Botão)
  const saveToDB = async (novoTipo = null) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const finalStatus = novoTipo || (status === 'G' ? 'GREEN' : status === 'R' ? 'RED' : 'PENDENTE');
      
      const { error } = await supabase.from('palpites').upsert({
          jogador_id: jogador.jogador_id, 
          semana: currentWeek, 
          resultado_individual: finalStatus,
          equipa_casa: details.ec, 
          equipa_fora: details.ef, 
          jogo: `${details.ec} vs ${details.ef}`,
          aposta: details.ap,
          odd: details.odd ? Number(details.odd) : null,
          data_palpite: new Date().toISOString().split('T')[0],
          liga_no_momento: rank <= 6 ? 'Norte' : 'Sul'
      }, { onConflict: 'jogador_id,semana' });
      
      if (error) throw error;
      if (onComplete) await onComplete();
    } catch (err) { 
      console.error(err);
    } finally { 
      setSaving(false); 
    }
  };

  const handleInstantBet = async (tipo) => {
     const nextStatus = (status === tipo) ? 'PENDENTE' : (tipo === 'G' ? 'GREEN' : 'RED');
     onBet(jogador.jogador_id, jogador.nome, (status === tipo) ? undefined : tipo);
     await saveToDB(nextStatus);
  };

  // Gestão de Mensalidade Instantânea
  const toggleMonthlyPayment = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const currentMonth = getMonthFromDate(new Date().toISOString());
      const isPaid = jogador.mensalidade_paga;
      
      const { error } = await supabase.from('mensalidades').upsert({
         jogador_id: jogador.jogador_id,
         mes: currentMonth,
         pago: !isPaid,
         data_pagamento: !isPaid ? new Date().toISOString() : null,
         valor_pago: 20.00
      }, { onConflict: 'jogador_id,mes' });

      if (error) throw error;
      
      // Se for pagamento novo, regista na Banca Master também
      if (!isPaid) {
          await supabase.from('banca_transacoes').insert({
             jogador_id: jogador.jogador_id,
             tipo: 'MENSALIDADE',
             valor: 20.00,
             descricao: `Pagamento Mensal - ${currentMonth}`
          });
      }

      if (onComplete) await onComplete();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-950 border-2 p-6 rounded-[40px] shadow-2xl transition-all duration-500 ${isPending ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/5'}`}>
      
      <div className="flex justify-between items-center mb-8 pt-2">
        <div className="flex items-center gap-5">
           <div className="relative">
              <div className="w-14 h-14 rounded-3xl overflow-hidden border-2 border-white/10 shadow-3xl bg-slate-900">
                {jogador.foto_url ? (
                  <img src={jogador.foto_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-black uppercase italic">{jogador.nome.substring(0,2)}</div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-950 border border-white/20 rounded-xl flex items-center justify-center text-[11px] font-black text-primary italic shadow-2xl">#{rank}</div>
           </div>
           <div>
              <h4 className="text-lg font-display font-black text-white uppercase italic tracking-tight leading-none mb-2">{jogador.nome}</h4>
              <div className="flex items-center gap-2">
                 {/* MENSALIDADE INDICATOR */}
                 <button 
                   onClick={toggleMonthlyPayment}
                   disabled={saving}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${jogador.mensalidade_paga ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'}`}
                 >
                    <div className={`w-2 h-2 rounded-full ${jogador.mensalidade_paga ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{jogador.mensalidade_paga ? 'PAGO' : 'MENSAL'}</span>
                 </button>

                 <div className="bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 inline-flex items-center gap-2">
                    <Trophy size={10} className="text-primary opacity-50" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">{jogador.total_greens || 0}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => handleInstantBet('G')} 
             disabled={saving}
             className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${status === 'G' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-emerald-500 border border-emerald-500/10'}`}
           >
              <Check size={24} strokeWidth={4} />
           </button>
           <button 
             onClick={() => handleInstantBet('R')} 
             disabled={saving}
             className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${status === 'R' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-slate-900 text-rose-500 border border-rose-500/10'}`}
           >
              <X size={24} strokeWidth={4} />
           </button>
        </div>
      </div>

      <div className="space-y-3 px-1">
         <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">Equipa da Casa</p>
            <input type="text" value={details.ec} onChange={e => setDetails({...details, ec: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-black text-white focus:outline-none focus:border-primary/40 uppercase shadow-inner" />
         </div>
         <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">Equipa de Fora</p>
            <input type="text" value={details.ef} onChange={e => setDetails({...details, ef: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-black text-white focus:outline-none focus:border-primary/40 uppercase shadow-inner" />
         </div>
         <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic ml-2">Aposta & Odd</p>
            <div className="grid grid-cols-[1fr_80px] gap-2">
               <input type="text" value={details.ap} onChange={e => setDetails({...details, ap: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-black text-white focus:outline-none focus:border-primary/40 uppercase shadow-inner" />
               <input type="text" value={details.odd} onChange={e => setDetails({...details, odd: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-2 py-4 text-xs font-black text-primary text-center focus:outline-none focus:border-primary/40 font-display transition-all" />
            </div>
         </div>
      </div>

      <div className="pt-6">
         <button 
           onClick={() => saveToDB()} 
           disabled={saving || !isAdmin} 
           className="w-full py-5 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] italic transition-all shadow-2xl active:scale-95 bg-primary text-slate-950 shadow-primary/30"
         >
            {saving ? 'A GUARDAR...' : 'Guardar Palpite 🔥'}
         </button>
      </div>
    </div>
  );
};

export default Palpites;
