import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { ArrowLeft, Target, TrendingUp, Flame, Snowflake, Award, Zap, AlertCircle } from 'lucide-react';
import { EliteCard, EliteAvatar, EliteBadge, EliteButton } from '../components/ui';

const PerfilJogador = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ranking, fullHistory, loading, currentWeek } = useDashboardData();

  const player = useMemo(() => ranking?.find(p => p.jogador_id === id), [ranking, id]);
  
  const stats = useMemo(() => {
    if (!fullHistory || !id) return null;
    const pHistory = fullHistory.filter(h => h.jogador_id === id);
    const resolvedPicks = pHistory.filter(h => h.resultado && h.resultado !== 'PENDING').sort((a, b) => Number(a.semana) - Number(b.semana));
    
    const totalPicks = resolvedPicks.length;
    const wins = resolvedPicks.filter(h => h.resultado === 'GREEN').length;
    const voids = resolvedPicks.filter(h => h.resultado === 'VOID').length;
    const losses = resolvedPicks.filter(h => h.resultado === 'RED').length;
    
    // Only consider non-voids for pure win rate, or just wins / total resolved
    const hitRate = totalPicks > 0 ? ((wins / totalPicks) * 100).toFixed(1) : '0.0';
    
    const greens = resolvedPicks.filter(h => h.resultado === 'GREEN');
    const highestOdd = greens.length > 0 ? Math.max(...greens.map(h => Number(h.odd) || 0)) : 0;
    
    // Last 5 weeks form
    const forma = resolvedPicks.slice(-5).map(h => h.resultado);
    
    // Calculate streaks
    let currentStreak = 0;
    let streakType = null; // 'W' or 'L'
    for (let i = resolvedPicks.length - 1; i >= 0; i--) {
      const res = resolvedPicks[i].resultado;
      if (res === 'VOID') continue; // ignore voids for streaks
      
      const type = res === 'GREEN' ? 'W' : 'L';
      if (!streakType) {
        streakType = type;
        currentStreak = 1;
      } else if (streakType === type) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { totalPicks, hitRate, highestOdd, forma, currentStreak, streakType, wins, losses, voids };
  }, [fullHistory, id]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">A carregar Perfil...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center mt-20">
        <p className="text-white text-xl font-black italic">Jogador não encontrado.</p>
        <EliteButton onClick={() => navigate(-1)} className="mt-4">Voltar</EliteButton>
      </div>
    );
  }

  const isNorte = player.liga_atual === 'Norte';

  // Badges Logic
  const badges = [];
  if (stats.highestOdd >= 3.0) badges.push({ id: 'sniper', label: 'Sniper', icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' });
  if (stats.streakType === 'W' && stats.currentStreak >= 3) badges.push({ id: 'fire', label: 'On Fire', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' });
  if (stats.streakType === 'L' && stats.currentStreak >= 3) badges.push({ id: 'ice', label: 'Geladeira', icon: Snowflake, color: 'text-blue-300', bg: 'bg-blue-500/10' });
  if (stats.totalPicks >= Number(currentWeek) - 2 && stats.totalPicks > 0) badges.push({ id: 'veteran', label: 'Relógio Suíço', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-6 pb-12 px-1 max-w-lg mx-auto pt-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
          Perfil <span className="text-primary">Elite</span>
        </h2>
      </div>

      {/* ID CARD */}
      <EliteCard padding="p-0" className="overflow-hidden border-t-4 border-t-primary relative">
        <div className={`absolute top-0 left-0 w-full h-32 opacity-20 bg-gradient-to-br ${isNorte ? 'from-blue-500 to-transparent' : 'from-orange-500 to-transparent'}`} />
        
        <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-4">
          <EliteAvatar src={player.foto_url} name={player.nome} size="xl" inDebt={player.em_divida} />
          
          <div>
            <h1 className="text-3xl font-display font-black text-white uppercase italic leading-none mb-2">{player.nome}</h1>
            <EliteBadge variant={isNorte ? "primary" : "warning"} size="sm">
              LIGA {player.liga_atual || 'DESCONHECIDA'}
            </EliteBadge>
          </div>

          {player.em_divida && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full mt-2">
              <AlertCircle size={14} className="text-rose-500" />
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Dívida Pendente</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-slate-950/50">
          <div className="p-4 flex flex-col items-center">
            <p className="text-3xl font-black text-primary italic leading-none">{player.total_greens || 0}</p>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Greens</span>
          </div>
          <div className="p-4 flex flex-col items-center">
            <p className="text-3xl font-black text-white italic leading-none">{stats.totalPicks}</p>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Apostas Feitas</span>
          </div>
        </div>
      </EliteCard>

      {/* ESTATÍSTICAS AVANÇADAS */}
      <div className="grid grid-cols-2 gap-4">
        <EliteCard variant="default" className="flex flex-col items-center justify-center text-center space-y-2 p-5 bg-slate-900/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1 text-primary">
            <Zap size={20} />
          </div>
          <p className="text-2xl font-black text-white italic">{stats.hitRate}%</p>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hit Rate</span>
        </EliteCard>

        <EliteCard variant="default" className="flex flex-col items-center justify-center text-center space-y-2 p-5 bg-slate-900/40">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1 text-emerald-500">
            <TrendingUp size={20} />
          </div>
          <p className="text-2xl font-black text-emerald-400 italic">{stats.highestOdd > 0 ? stats.highestOdd.toFixed(2) : '-'}</p>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Maior Odd Ganha</span>
        </EliteCard>
      </div>

      {/* SALA DE TROFÉUS (BADGES) */}
      {badges.length > 0 && (
        <EliteCard variant="default" padding="p-5" className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
            <Award size={14} className="text-primary" /> Sala de Troféus
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.map(b => (
              <div key={b.id} className={`flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-slate-950/50 ${b.bg}`}>
                <b.icon size={18} className={b.color} />
                <span className={`text-[10px] font-black uppercase tracking-widest italic ${b.color}`}>{b.label}</span>
              </div>
            ))}
          </div>
        </EliteCard>
      )}

      {/* FORMA RECENTE */}
      <EliteCard variant="default" padding="p-5" className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Forma (Últimos 5)</h3>
        
        <div className="flex gap-2 justify-between">
          {[...Array(5)].map((_, i) => {
            const result = stats.forma[stats.forma.length - 5 + i]; // Pad left
            let bgClass = "bg-slate-950 border-white/5";
            let textClass = "text-slate-600";
            let char = "-";

            if (result === 'GREEN') { bgClass = "bg-emerald-500/20 border-emerald-500/30"; textClass = "text-emerald-500"; char = "G"; }
            else if (result === 'RED') { bgClass = "bg-rose-500/20 border-rose-500/30"; textClass = "text-rose-500"; char = "R"; }
            else if (result === 'VOID') { bgClass = "bg-slate-500/20 border-slate-500/30"; textClass = "text-slate-300"; char = "V"; }

            return (
              <div key={i} className={`flex-1 aspect-square rounded-2xl flex items-center justify-center border text-lg font-black italic ${bgClass} ${textClass}`}>
                {char}
              </div>
            );
          })}
        </div>
      </EliteCard>

    </div>
  );
};

export default PerfilJogador;
