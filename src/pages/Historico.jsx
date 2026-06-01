import React, { useState, useEffect } from 'react';
import { useHistoryData } from '../hooks/useHistoryData';
import { useDashboardData } from '../hooks/useDashboardData';
import { Trophy, Landmark, Users, ChevronDown, ChevronUp, Calendar, Award, Star, History as HistoryIcon } from 'lucide-react';
import { EliteCard, EliteAvatar, EliteBadge } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/formatters';
import HighlightCarousel from '../components/shared/HighlightCarousel';

const Historico = () => {
  const { history, loading: loadingHistory } = useHistoryData();
  const { 
    allMonthlyRankings, months, currentMonth, loading: loadingDash,
    playerLeagueWins, stats
  } = useDashboardData();

  const [expandedEpoca, setExpandedEpoca] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Filtrar para mostrar apenas meses PASSADOS (não o atual)
  const pastMonths = months.filter(m => m !== currentMonth);

  useEffect(() => {
    if (pastMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(pastMonths[0]); // Seleciona o mês passado mais recente por defeito
    }
  }, [pastMonths, selectedMonth]);

  if (loadingHistory || loadingDash) return <div className="text-white text-center mt-20 font-black uppercase text-xs animate-pulse">Consultando Arquivos da Elite...</div>;

  // Lógica da Temporada Atual
  const currentMonthlyRank = allMonthlyRankings[selectedMonth] || [];
  const topAcertosMes = currentMonthlyRank[0]?.acertos_mes || 0;
  const melhoresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === topAcertosMes && topAcertosMes > 0);
  const bottomAcertosMes = currentMonthlyRank[currentMonthlyRank.length - 1]?.acertos_mes ?? -1;
  const pioresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === bottomAcertosMes && bottomAcertosMes !== -1);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-20 pt-4 px-1 max-w-lg mx-auto">
      
      {/* TÍTULO DA PÁGINA */}
      <div className="text-left flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
            <Trophy className="text-primary" size={28} />
            <span>Museu <span className="text-primary tracking-widest text-xl">Elite</span></span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">O legado imortal das lendas da liga</p>
        </div>
      </div>

      {/* SECÇÃO: TEMPORADA ATUAL (ARQUIVO MENSAL) */}
      {pastMonths.length > 0 && (
        <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <HistoryIcon className="text-primary" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Época Atual 2026/2027</h3>
        </div>

        <EliteCard variant="default" padding="p-6" className="space-y-6 border-white/5 bg-slate-900/40">
          {/* Seletor de Mês */}
          <div className="relative">
            <button 
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="w-full flex items-center justify-between bg-slate-950/80 border border-white/5 p-4 rounded-2xl hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-primary" />
                <span className="text-sm font-black text-white uppercase italic">{selectedMonth || 'Selecionar Mês'}</span>
              </div>
              <ChevronDown size={18} className={`text-slate-500 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMonthDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMonthDropdown(false)}></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {pastMonths.map(m => (
                      <button 
                        key={m} 
                        onClick={() => { setSelectedMonth(m); setShowMonthDropdown(false); }}
                        className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest italic border-b border-white/5 last:border-0 hover:bg-primary/5 ${selectedMonth === m ? 'text-primary bg-primary/5' : 'text-slate-400'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Destaques Mensais */}
          <div className="flex flex-col gap-4">
            <HighlightCarousel title="MELHOR DO MÊS" players={melhoresDoMes} type="best" month={selectedMonth} />
            <HighlightCarousel title="PIOR DO MÊS" players={pioresDoMes} type="worst" month={selectedMonth} />
          </div>

          {/* Estatísticas de Lucratividade e Impacto */}
          <div className="pt-8 border-t border-white/5 space-y-10">
            
            {/* Lucratividade das Ligas */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 px-1">
                <Landmark size={14} className="text-primary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Lucratividade por Liga</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform"><Trophy size={40} /></div>
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Liga Norte</span>
                  <p className="text-xl font-black text-white mt-1 italic">{formatCurrency(stats?.leagueLucrativity?.norte || 0)}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform"><Star size={40} /></div>
                  <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Liga Sul</span>
                  <p className="text-xl font-black text-white mt-1 italic">{formatCurrency(stats?.leagueLucrativity?.sul || 0)}</p>
                </div>
              </div>
            </div>

            {/* Mestres do Lucro (Pé Quentes) */}
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Landmark size={14} className="text-primary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Mestres do Lucro (Impacto)</h4>
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Vitórias Coletivas</span>
              </div>

              {/* PÓDIO TOP 3 */}
              <div className="flex items-end justify-center gap-2 mb-8 mt-2 h-36">
                {/* 2º LUGAR */}
                {playerLeagueWins?.[1] && (
                  <div className="flex flex-col items-center flex-1 pb-2">
                    <div className="relative mb-2">
                      <EliteAvatar src={playerLeagueWins[1].foto_url} name={playerLeagueWins[1].nome} size="md" className="border-slate-400/50" />
                      <div className="absolute -bottom-2 -right-1 bg-slate-400 text-slate-950 text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">2º</div>
                    </div>
                    <p className="text-[8px] font-black text-white uppercase truncate w-20 text-center">{playerLeagueWins[1].nome.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-primary">{playerLeagueWins[1].wins} 🏆</p>
                  </div>
                )}

                {/* 1º LUGAR */}
                {playerLeagueWins?.[0] && (
                  <div className="flex flex-col items-center flex-1 z-10">
                    <div className="relative mb-3">
                      <EliteAvatar src={playerLeagueWins[0].foto_url} name={playerLeagueWins[0].nome} size="lg" className="border-yellow-500 shadow-lg shadow-yellow-500/20" />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900 animate-bounce">REI</div>
                      <div className="absolute -bottom-2 -right-1 bg-yellow-500 text-slate-950 text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900">1º</div>
                    </div>
                    <p className="text-[10px] font-black text-white uppercase truncate w-24 text-center italic tracking-tight">{playerLeagueWins[0].nome.split(' ')[0]}</p>
                    <p className="text-sm font-black text-primary">{playerLeagueWins[0].wins} 🏆</p>
                  </div>
                )}

                {/* 3º LUGAR */}
                {playerLeagueWins?.[2] && (
                  <div className="flex flex-col items-center flex-1 pb-2">
                    <div className="relative mb-2">
                      <EliteAvatar src={playerLeagueWins[2].foto_url} name={playerLeagueWins[2].nome} size="md" className="border-amber-700/50" />
                      <div className="absolute -bottom-2 -right-1 bg-amber-700 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">3º</div>
                    </div>
                    <p className="text-[8px] font-black text-white uppercase truncate w-20 text-center">{playerLeagueWins[2].nome.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-primary">{playerLeagueWins[2].wins} 🏆</p>
                  </div>
                )}
              </div>

              {/* RESTO DO RANKING (COMPACTO) */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-hide pt-2">
                {playerLeagueWins?.slice(3, 10).map((p, idx) => (
                  <div key={p.jogador_id} className="flex items-center justify-between py-2 px-3 bg-slate-950/40 rounded-xl border border-white/5 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-600">#{idx + 4}</span>
                      <EliteAvatar src={p.foto_url} name={p.nome} size="xs" />
                      <p className="text-[10px] font-black text-white uppercase italic">{p.nome}</p>
                    </div>
                    <p className="text-xs font-black text-primary italic">{p.wins} 🏆</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </EliteCard>
      </section>
      )}

      {/* SECÇÃO: MUSEU ELITE (ÉPOCAS PASSADAS) */}
      <section className="space-y-6 border-t border-white/5 pt-10">
        <div className="flex items-center gap-3 px-1">
          <Landmark className="text-primary" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Arquivo Histórico</h3>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[32px] p-10 text-center">
            <Star size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nenhuma época finalizada nos arquivos</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((epoca) => {
              const isExpanded = expandedEpoca === epoca.id;
              const ranking = epoca.ranking_json || [];
              
              return (
                <div key={epoca.id} className="group">
                  <EliteCard 
                    variant={isExpanded ? "primary" : "default"} 
                    padding="p-0"
                    className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-4 ring-primary/5' : ''}`}
                  >
                    <button 
                      onClick={() => setExpandedEpoca(isExpanded ? null : epoca.id)}
                      className="w-full p-6 flex items-center justify-between group-hover:bg-white/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${isExpanded ? 'bg-primary text-slate-950 border-primary' : 'bg-slate-950 text-primary border-white/5'}`}>
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{epoca.nome_epoca}</h3>
                          <div className="flex gap-2 mt-2">
                            <EliteBadge variant="primary" size="xs">Encerrada em {formatDate(epoca.data_encerramento)}</EliteBadge>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-slate-500" />}
                    </button>

                    {isExpanded && (
                      <div className="p-6 pt-0 border-t border-white/5 animate-in slide-in-from-top-4 duration-500 space-y-8">
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Landmark size={14} className="text-primary" />
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Banca Final</span>
                            </div>
                            <p className="text-xl font-black text-white italic">{formatCurrency(epoca.saldo_final)}</p>
                          </div>
                          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Users size={14} className="text-primary" />
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Participantes</span>
                            </div>
                            <p className="text-xl font-black text-white italic">{ranking.length}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-1">
                            <Award size={16} className="text-yellow-500" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Vencedores</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-[24px]">
                              <div className="flex items-center gap-4">
                                <EliteBadge variant="warning" size="xs">NORTE</EliteBadge>
                                <p className="text-sm font-black text-white uppercase italic">{epoca.vencedor_norte || 'Desconhecido'}</p>
                              </div>
                              <Trophy size={18} className="text-yellow-500" />
                            </div>
                            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-4 rounded-[24px]">
                              <div className="flex items-center gap-4">
                                <EliteBadge variant="primary" size="xs">SUL</EliteBadge>
                                <p className="text-sm font-black text-white uppercase italic">{epoca.vencedor_sul || 'Desconhecido'}</p>
                              </div>
                              <Star size={18} className="text-blue-400" />
                            </div>
                          </div>
                        </div>

                        {/* CLASSIFICAÇÃO FINAL DA ÉPOCA */}
                        {ranking && ranking.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 px-1">
                              <Trophy size={16} className="text-primary" />
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Classificação Final</h4>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                              {ranking.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 px-4 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                                  <div className="flex items-center gap-4">
                                    <span className={`w-6 text-center text-xs font-black ${idx === 0 ? 'text-yellow-500' : 'text-slate-600'}`}>#{idx + 1}</span>
                                    <EliteAvatar src={p.foto_url} name={p.nome} size="sm" />
                                    <div>
                                      <p className="text-xs font-black text-white uppercase italic leading-none">{p.nome}</p>
                                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 inline-block ${p.liga_atual?.toLowerCase() === 'norte' ? 'text-blue-400' : 'text-orange-400'}`}>
                                        Liga {p.liga_atual || 'Desconhecida'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-black text-primary italic leading-none">{p.total_greens || 0}</p>
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Greens</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </EliteCard>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Historico;
