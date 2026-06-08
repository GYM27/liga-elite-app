import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMissaoData } from '../hooks/useMissaoData';
import { Heart, Target, TrendingUp, Check, X, AlertCircle, Award, Gavel, Trash2, Edit3, ThumbsUp } from 'lucide-react';
import { EliteCard, EliteButton, EliteAvatar } from '../components/ui';

const MissaoJantar = () => {
  const { isAdmin } = useAdmin();
  const { ranking, currentWeek } = useDashboardData();
  const { 
    campanha, propostas, votos, historicoApostas, loading, 
    addProposta, votar, fecharVotacao, resolverApostaOficial, eliminarProposta, editarProposta
  } = useMissaoData();

  const [newProp, setNewProp] = useState({ jogadorId: '', equipaCasa: '', equipaFora: '', aposta: '' });
  const [voterId, setVoterId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPropId, setEditingPropId] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">A preparar a mesa...</p>
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center">
        <Target size={48} className="text-slate-600 mb-2" />
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Sem Missão Ativa</h2>
        <p className="text-slate-400 text-sm">O Admin precisa de criar a campanha de Jantar para este mês na base de dados.</p>
      </div>
    );
  }

  const progresso = (campanha.banca_atual / campanha.objetivo) * 100;
  const apostaOficial = propostas.find(p => p.oficial);
  
  // Calcula votos para cada proposta
  const propostasComVotos = propostas.map(p => ({
    ...p,
    totalVotos: votos.filter(v => v.proposta_id === p.id).length
  })).sort((a, b) => b.totalVotos - a.totalVotos);

  const handleAddProposta = async () => {
    if (!newProp.jogadorId || !newProp.equipaCasa || !newProp.equipaFora || !newProp.aposta) return alert("Preenche tudo!");
    setIsSubmitting(true);
    
    const jogoDb = `${newProp.equipaCasa} vs ${newProp.equipaFora}`;
    const mercadoDb = newProp.aposta;
    
    // Mandamos sempre odd 1.0 para a base de dados para não quebrar a coluna NOT NULL
    if (editingPropId) {
      await editarProposta(editingPropId, jogoDb, mercadoDb, 1.0);
      setEditingPropId(null);
    } else {
      await addProposta(newProp.jogadorId, jogoDb, mercadoDb, 1.0);
    }
    
    setNewProp({ jogadorId: '', equipaCasa: '', equipaFora: '', aposta: '' });
    setIsSubmitting(false);
  };

  const handleVotar = async (propostaId) => {
    if (!voterId) return alert("Seleciona quem és primeiro no topo da lista de votação!");
    setIsSubmitting(true);
    const success = await votar(voterId, propostaId);
    if (!success) alert("Já votaste esta semana ou ocorreu um erro.");
    setIsSubmitting(false);
  };

  const handleResolverGreen = () => {
    const valorGanho = prompt(`A banca atual é ${campanha.banca_atual}€ e foram All-in.\nQual foi o valor TOTAL ganho/recebido da casa de apostas (ex: 15.50)?`);
    if (valorGanho && !isNaN(valorGanho)) {
      resolverApostaOficial(apostaOficial, 'GREEN', parseFloat(valorGanho));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-2 max-w-lg mx-auto pt-4 text-left">
      
      {/* HEADER DA MISSÃO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">
            Missão <span className="text-primary tracking-widest">Jantar 🍔</span>
          </h2>
          <div className="flex gap-1">
            {[...Array(2)].map((_, i) => (
              <Heart key={i} size={24} className={i < campanha.vidas_restantes ? "text-rose-500 fill-rose-500" : "text-slate-700"} />
            ))}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <EliteCard variant="default" padding="p-5" className="border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-1000 ease-out" style={{ width: `${progresso}%` }} />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Banca Atual</p>
                <p className="text-3xl font-black text-white italic leading-none">{campanha.banca_atual}€</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Objetivo</p>
                <p className="text-xl font-black text-slate-400 italic leading-none">{campanha.objetivo}€</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 mt-2">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </EliteCard>
      </div>

      {/* APOSTA OFICIAL (SE EXISTIR) */}
      {apostaOficial && (
        <section className="space-y-4 animate-in zoom-in">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic border-l-4 border-primary pl-3">Aposta Oficial (Semana {currentWeek})</h3>
          
          <EliteCard variant="primary" padding="p-5" className="border-primary/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Award size={100} /></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <EliteAvatar src={apostaOficial.jogador?.foto_url} name={apostaOficial.jogador?.nome} size="sm" />
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Aprovada pelo Conselho</p>
                  <p className="text-sm font-black text-slate-950 uppercase italic leading-none">Proposta de {apostaOficial.jogador?.nome}</p>
                </div>
              </div>

              <div className="bg-slate-950/20 rounded-2xl p-4 mb-4 border border-slate-900/10">
                <p className="text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">{apostaOficial.jogo}</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-sm font-bold text-slate-800">{apostaOficial.mercado}</p>
                </div>
              </div>

              {/* RESOLUÇÃO DA APOSTA (ADMIN) */}
              {isAdmin && apostaOficial.resultado === 'PENDENTE' && (
                <div className="pt-4 border-t border-slate-900/10 space-y-3">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center">Resolução (Admin)</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleResolverGreen}
                      className="flex-1 bg-emerald-500 text-white h-12 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 shadow-xl"
                    >
                      <Check size={16} /> Deu Green!
                    </button>
                    <button 
                      onClick={() => resolverApostaOficial(apostaOficial, 'RED')}
                      className="flex-1 bg-rose-500 text-white h-12 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 shadow-xl"
                    >
                      <X size={16} /> Deu Red...
                    </button>
                  </div>
                </div>
              )}
              
              {apostaOficial.resultado !== 'PENDENTE' && (
                <div className="text-center pt-2">
                   <p className={`text-xl font-black uppercase italic ${apostaOficial.resultado === 'GREEN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                     ESTADO: {apostaOficial.resultado}
                   </p>
                </div>
              )}
            </div>
          </EliteCard>
        </section>
      )}

      {/* MESA REDONDA - VOTAÇÕES */}
      {!apostaOficial && (
        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic border-l-4 border-blue-500 pl-3">A Mesa Redonda</h3>
          
          {/* Adicionar Proposta */}
          <EliteCard variant="default" padding="p-5" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-500" size={18} />
              <h4 className="text-sm font-black text-white uppercase italic">{editingPropId ? "Editar Palpite" : "Sugerir Palpite"}</h4>
              {editingPropId && (
                <button 
                  onClick={() => { setEditingPropId(null); setNewProp({ jogadorId: '', equipaCasa: '', equipaFora: '', aposta: '' }); }}
                  className="ml-auto text-[10px] text-rose-500 uppercase font-black px-2 py-1 bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            
            <select 
              value={newProp.jogadorId} 
              onChange={e => setNewProp({...newProp, jogadorId: e.target.value})}
              disabled={editingPropId !== null}
              className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none disabled:opacity-50"
            >
              <option value="">Sou o...</option>
              {ranking?.map(j => <option key={j.jogador_id} value={j.jogador_id}>{j.nome}</option>)}
            </select>
            
            <div className="grid grid-cols-2 gap-2">
              <input 
                placeholder="Equipa Casa" 
                value={newProp.equipaCasa} onChange={e => setNewProp({...newProp, equipaCasa: e.target.value})}
                className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
              />
              <input 
                placeholder="Equipa Fora" 
                value={newProp.equipaFora} onChange={e => setNewProp({...newProp, equipaFora: e.target.value})}
                className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
              />
            </div>
            
            <input 
              placeholder="Aposta (Ex: Vencedor Casa, Real Madrid)" 
              value={newProp.aposta} onChange={e => setNewProp({...newProp, aposta: e.target.value})}
              className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
            />
            
            <EliteButton onClick={handleAddProposta} disabled={isSubmitting} variant="primary" className="h-12 text-xs">
              {editingPropId ? "Gravar Alterações" : "Submeter Proposta"}
            </EliteButton>
          </EliteCard>

          {/* Lista de Propostas e Votação */}
          {propostas.length > 0 && (
            <div className="space-y-4 pt-4">
              {/* DESTAQUE DO ELEITOR */}
              <div className="bg-primary/10 border-2 border-primary/30 p-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                <p className="text-[10px] font-black text-slate-300 uppercase italic mb-2 tracking-widest text-center">Quem vai votar agora?</p>
                <select 
                  value={voterId} 
                  onChange={e => setVoterId(e.target.value)}
                  className="w-full h-14 bg-slate-950 border border-primary/50 rounded-xl px-4 text-sm font-black text-primary outline-none focus:border-primary text-center uppercase tracking-widest transition-all hover:bg-slate-900 cursor-pointer"
                >
                  <option value="">-- SELECIONA O TEU NOME --</option>
                  {ranking?.map(j => <option key={j.jogador_id} value={j.jogador_id}>{j.nome}</option>)}
                </select>
              </div>

              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Votação Aberta</h4>

              {propostasComVotos.map((p, idx) => (
                <div key={p.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex gap-3 items-center">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-950 rounded-xl border border-white/5 shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Votos</span>
                    <span className="text-lg font-black text-primary">{p.totalVotos}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white uppercase leading-tight break-words">{p.jogo}</p>
                    <p className="text-[10px] text-slate-400 font-bold leading-tight break-words mt-1">{p.mercado}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase mt-2">Por: {p.jogador?.nome}</p>
                  </div>
                  
                  <div className="flex gap-1 shrink-0 ml-1">
                    <button 
                      onClick={() => handleVotar(p.id)}
                      disabled={isSubmitting}
                      className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-slate-950 transition-colors shrink-0"
                      title="Votar"
                    >
                      <ThumbsUp size={18} />
                    </button>
                    
                    <button 
                      onClick={() => {
                        setEditingPropId(p.id);
                        const [casa, fora] = (p.jogo || "").split(" vs ");
                        setNewProp({ 
                          jogadorId: p.jogador_id, 
                          equipaCasa: casa || '', 
                          equipaFora: fora || '',
                          aposta: p.mercado || ''
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={isSubmitting}
                      className="w-10 h-10 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center border border-white/10 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
                      title="Editar Proposta"
                    >
                      <Edit3 size={16} />
                    </button>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => eliminarProposta(p.id)}
                        disabled={isSubmitting}
                        className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors shrink-0"
                        title="Eliminar Proposta"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isAdmin && (
                <button 
                  onClick={() => fecharVotacao(propostasComVotos[0].id)}
                  className="w-full h-14 mt-4 rounded-2xl border-2 border-primary text-primary font-black uppercase text-xs hover:bg-primary hover:text-slate-950 transition-all flex items-center justify-center gap-2"
                >
                  <Gavel size={18} /> Encerrar Votação (Escolher Vencedora)
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* HISTÓRICO DE APOSTAS OFICIAIS */}
      {historicoApostas && historicoApostas.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic border-l-4 border-slate-500 pl-3">Histórico de All-Ins</h3>
          <div className="space-y-3">
            {historicoApostas.map(hist => (
              <EliteCard key={hist.id} variant="default" padding="p-4" className={`border-l-4 ${hist.resultado === 'GREEN' ? 'border-l-emerald-500' : hist.resultado === 'RED' ? 'border-l-rose-500' : 'border-l-slate-500'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Semana {hist.semana}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${hist.resultado === 'GREEN' ? 'bg-emerald-500/20 text-emerald-500' : hist.resultado === 'RED' ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-500/20 text-slate-400'}`}>
                    {hist.resultado}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-black text-white uppercase leading-tight truncate max-w-[200px]">{hist.jogo}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{hist.mercado}</p>
                  </div>
                </div>
              </EliteCard>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default MissaoJantar;
