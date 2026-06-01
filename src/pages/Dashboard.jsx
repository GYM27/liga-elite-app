import React from 'react';
import LiveTracker from '../components/dashboard/LiveTracker';
import ElitePodium from '../components/shared/ElitePodium';
import { useDashboardData } from '../hooks/useDashboardData';
import { ChevronRight, TrendingUp, ArrowUpCircle, ArrowDownCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EliteCard, EliteBadge } from '../components/ui';

const Dashboard = () => {
  const { 
    nortePalpites, sulPalpites, ranking, loading, currentWeek, promovidos, descidos 
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Recrutando Elite...</p>
      </div>
    );
  }



  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8">
      {/* Intro Text */}
      <div className="w-full text-center py-2 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-4 uppercase italic">
          BOA SORTE, <span className="text-primary tracking-widest">ELITE.</span>
        </h2>
        <EliteBadge variant="primary" size="md">Semana {currentWeek} em curso</EliteBadge>
      </div>
      
      {/* Mensagens de Promoção / Descida */}
      {(promovidos?.length > 0 || descidos?.length > 0) && (
        <div className="space-y-4">
          {promovidos?.length > 0 && (
            <EliteCard variant="primary" padding="p-4" className="flex items-start gap-4 animate-in zoom-in duration-500 border-primary/30">
              <ArrowUpCircle className="text-primary mt-1 shrink-0" size={24} />
              <div className="text-left">
                <h3 className="text-white font-black uppercase italic tracking-wider text-xs">
                  {promovidos.length === 1 ? 'Parabéns pela Promoção! 🚀' : 'Parabéns aos Promovidos! 🚀'}
                </h3>
                <p className="text-slate-300 text-[11px] mt-1 font-bold">
                  <span className="text-white">{promovidos.map(p => p.nome).join(', ')}</span> 
                  {promovidos.length === 1 ? ' subiu' : ' subiram'} para a Liga Norte.
                </p>
              </div>
            </EliteCard>
          )}
          {descidos?.length > 0 && (
            <EliteCard variant="danger" padding="p-4" className="flex items-start gap-4 animate-in zoom-in duration-500 border-rose-500/30">
              <ArrowDownCircle className="text-rose-500 mt-1 shrink-0" size={24} />
              <div className="text-left">
                <h3 className="text-white font-black uppercase italic tracking-wider text-xs">
                  Atenção aos que Desceram
                </h3>
                <p className="text-slate-300 text-[11px] mt-1 font-bold">
                  <span className="text-white">{descidos.map(p => p.nome).join(', ')}</span> 
                  {descidos.length === 1 ? ' desceu' : ' desceram'} para a Liga Sul.
                </p>
              </div>
            </EliteCard>
          )}
        </div>
      )}

      <LiveTracker norteSegments={nortePalpites} sulSegments={sulPalpites} currentWeek={currentWeek} />

      {/* Atalho para Estatísticas Financeiras */}
      <div className="px-1">
        <Link 
          to="/estatisticas"
          className="w-full flex items-center justify-between p-6 bg-slate-900 border-2 border-white/5 rounded-[32px] hover:border-primary/30 transition-all group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <TrendingUp size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-xs uppercase tracking-widest italic">Controlo de Mensalidades</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">Auditoria Mensal</p>
            </div>
          </div>
          <ChevronRight size={22} className="text-primary group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      {/* Atalho para Missão Jantar */}
      <div className="px-1">
        <Link 
          to="/missao"
          className="w-full flex items-center justify-between p-6 bg-slate-900 border-2 border-white/5 rounded-[32px] hover:border-rose-500/30 transition-all group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20">
              <Target size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-xs uppercase tracking-widest italic">Missão Jantar 🍔</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">Votação & Progresso</p>
            </div>
          </div>
          <ChevronRight size={22} className="text-rose-500 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic">Líderes da Elite</h3>
          <Link to="/classificacao" className="text-[10px] font-black text-primary uppercase italic hover:underline">Ver Todos</Link>
        </div>
        <ElitePodium players={ranking} />
      </div>
    </div>
  );
};

export default Dashboard;
