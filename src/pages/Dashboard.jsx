import React from 'react';
import StatusWidget from '../components/dashboard/StatusWidget';
import LiveTracker from '../components/dashboard/LiveTracker';
import FinanceGrid from '../components/dashboard/FinanceGrid';
import RankingTeaser from '../components/dashboard/RankingTeaser';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  const { nortePalpites, sulPalpites, stats, submissions, ranking, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-display font-medium animate-pulse">A carregar dados da Elite...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Intro Text */}
      <div className="mb-8">
        <h2 className="text-3xl font-display font-black text-white tracking-tight leading-none mb-2 uppercase italic">
          BOA SORTE, <span className="text-primary tracking-widest">ELITE.</span>
        </h2>
        <p className="text-slate-500 font-medium text-sm">
          Estado das múltiplas em <span className="text-primary/80 font-bold">tempo real</span>.
        </p>
      </div>

      <StatusWidget norteCount={submissions.norte} sulCount={submissions.sul} />
      <LiveTracker norteSegments={nortePalpites} sulSegments={sulPalpites} />
      <FinanceGrid stats={stats} />
      <RankingTeaser top3={ranking.slice(0, 3)} />
    </div>
  );
};

export default Dashboard;
