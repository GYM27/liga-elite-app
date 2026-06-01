import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { Trophy, History, Crown, Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { EliteCard, EliteAvatar, EliteButton } from '../components/ui';
import HallOfFameModal from '../components/shared/HallOfFameModal';
import PromotionBanner from '../components/shared/PromotionBanner';
import HighlightCarousel from '../components/shared/HighlightCarousel';
import { Link } from 'react-router-dom';

const RankingItem = ({ player, rank, isTop }) => (
  <Link to={`/perfil/${player.jogador_id}`} className="block transition-transform hover:scale-[1.02]">
    <EliteCard variant="default" padding="p-4" className="flex items-center justify-between h-20 group hover:bg-slate-800/20 transition-all">
    <div className="flex items-center gap-4 flex-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isTop ? 'bg-yellow-500 text-slate-950' : 'bg-slate-900 text-slate-500'}`}>
        {rank}
      </div>

      <EliteAvatar src={player.foto_url} name={player.nome} size="md" />
      
      <div className="flex flex-col justify-center text-left">
        <p className="font-black text-white uppercase italic group-hover:text-primary transition-colors leading-tight mb-1">
          {player.nome}
        </p>
        <div className="flex gap-1.5 items-center">
          {(player.forma_recente || []).map((f, idx) => (
            <span key={idx} className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${f.resultado === 'GREEN' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
              {f.resultado === 'GREEN' ? '✓' : '✗'}
            </span>
          ))}
          {!(player.forma_recente?.length > 0) && <span className="text-[9px] text-slate-500 italic">Sem registo</span>}
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-3 pr-2">
      {player.foi_promovido && <TrendingUp size={16} className="text-emerald-500 animate-bounce" />}
      {player.foi_descido && <TrendingDown size={16} className="text-rose-500 animate-bounce" />}
      <p className="text-xl font-black text-primary italic">{player.total_greens || 0}</p>
    </div>
    </EliteCard>
  </Link>
);

const Classificacao = () => {
  const { 
    ranking, allMonthlyRankings, hallOfFame, currentMonth, 
    idsNorte, idsSul, loading, lastPromotion 
  } = useDashboardData();
  
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [promotion, setPromotion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { if (lastPromotion) setPromotion(lastPromotion); }, [lastPromotion]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-white font-black animate-pulse text-xs">Sincronizando História Geral...</div>;

  const rankingNorte = (ranking || []).filter(p => idsNorte.includes(p.jogador_id));
  const rankingSul = (ranking || []).filter(p => idsSul.includes(p.jogador_id));

  const p1 = ranking?.[0];
  const p2 = ranking?.[1];
  const diffNorte = (p1 && p2) ? (p1.total_greens - p2.total_greens) : null;

  const p6 = ranking?.[5];
  const p7 = ranking?.[6];
  const diff = (p6 && p7) ? (p6.total_greens - p7.total_greens) : null;

  // Destaques do Mês ATUAL
  const currentMonthlyRank = allMonthlyRankings[currentMonth] || [];
  const topAcertosMes = currentMonthlyRank[0]?.acertos_mes || 0;
  const melhoresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === topAcertosMes && topAcertosMes > 0);
  const bottomAcertosMes = currentMonthlyRank[currentMonthlyRank.length - 1]?.acertos_mes ?? -1;
  const pioresDoMes = currentMonthlyRank.filter(p => p.acertos_mes === bottomAcertosMes && bottomAcertosMes !== -1);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20 pt-4 px-1 max-w-lg mx-auto">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between bg-slate-800/10 border border-white/5 p-5 rounded-[32px]">
        <div className="text-left">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Ligas <span className="text-primary italic">Elite</span></h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 italic">{currentMonth || 'Carregando...'}</p>
        </div>

        <div className="flex gap-2">
          <EliteButton 
            variant="secondary" 
            className="h-12 px-4 rounded-xl bg-slate-900/50" 
            onClick={() => setShowHallOfFame(true)} 
            icon={Award}
          >
            Stats
          </EliteButton>
          
          <EliteButton 
            variant="primary" 
            className="h-12 px-4 rounded-xl" 
            onClick={() => navigate('/historico')} 
            icon={Trophy}
          >
            Histórico
          </EliteButton>
        </div>
      </div>

      {/* BOTÃO EVOLUÇÃO GLOBAL */}
      <div className="px-1 mt-4">
        <Link 
          to="/evolucao"
          className="w-full flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <TrendingUp size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-xs uppercase tracking-widest italic">Evolução Global</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 italic">Gráfico de desempenho</p>
            </div>
          </div>
          <div className="text-primary font-black animate-pulse">➔</div>
        </Link>
      </div>

      {/* DESTAQUES DO MÊS ATUAL */}
      <div className="flex flex-col sm:flex-row gap-4">
        <HighlightCarousel title="MELHOR DO MÊS" players={melhoresDoMes} type="best" month={currentMonth} />
        <HighlightCarousel title="PIOR DO MÊS" players={pioresDoMes} type="worst" month={currentMonth} />
      </div>

      <PromotionBanner lastPromotion={promotion} onDismiss={() => setPromotion(null)} />

      {/* RANKINGS POR LIGA */}
      <div className="space-y-14 pt-8 border-t border-white/5">
        
        {/* LIGA NORTE */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-3 border-b border-white/5 pb-4">
            <h3 className="text-xl font-black uppercase tracking-tight italic text-blue-400">Liga Norte</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Greens</span>
          </div>

          {p1 && p2 && diffNorte !== null && diffNorte <= 1 && (
            <EliteCard variant="warning" padding="p-6" className="animate-in zoom-in duration-500">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/20"><Crown size={24} /></div>
                <div>
                  <h4 className="text-white font-black uppercase italic tracking-tight text-sm">Luta pelo Trono 👑</h4>
                  <p className="text-[11px] text-slate-400 mt-1"><span className="text-white font-bold">{p2.nome}</span> está {diffNorte === 0 ? 'empatado' : `a apenas 1 Green`} de roubar a coroa!</p>
                </div>
              </div>
            </EliteCard>
          )}

          <div className="space-y-3">
            {rankingNorte.map((p, i) => (
              <RankingItem key={p.jogador_id} player={p} rank={i + 1} isTop={i === 0} />
            ))}
          </div>
        </section>

        {/* BANNER PERSEGUIDOR */}
        {p6 && p7 && diff !== null && diff <= 1 && (
          <EliteCard variant="primary" padding="p-6" className="animate-in zoom-in duration-500 border-amber-500/20">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20"><Target size={24} /></div>
              <div>
                <h4 className="text-white font-black uppercase italic tracking-tight text-sm">O Perseguidor 🏃‍♂️</h4>
                <p className="text-[11px] text-slate-400 mt-1"><span className="text-white font-bold">{p7.nome}</span> está a morder os calcanhares de <span className="text-white font-bold">{p6.nome}</span>!</p>
              </div>
            </div>
          </EliteCard>
        )}

        {/* LIGA SUL */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-3 border-b border-white/5 pb-4">
            <h3 className="text-xl font-black uppercase tracking-tight italic text-orange-400">Liga Sul</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Greens</span>
          </div>
          <div className="space-y-3">
            {rankingSul.map((p, i) => (
              <RankingItem key={p.jogador_id} player={p} rank={i + rankingNorte.length + 1} isTop={false} />
            ))}
          </div>
        </section>
      </div>

      <HallOfFameModal isOpen={showHallOfFame} onClose={() => setShowHallOfFame(false)} hallOfFame={hallOfFame} />
    </div>
  );
};

export default Classificacao;
