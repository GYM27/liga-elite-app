import React from 'react';
import StatusWidget from '../components/dashboard/StatusWidget';
import LiveTracker from '../components/dashboard/LiveTracker';
import FinanceGrid from '../components/dashboard/FinanceGrid';
import RankingTeaser from '../components/dashboard/RankingTeaser';

const Dashboard = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Intro Text */}
      <div className="mb-8">
        <h2 className="text-3xl font-display font-black text-white tracking-tight leading-none mb-2">
          BOA SORTE, <span className="text-primary italic">ELITE.</span>
        </h2>
        <p className="text-slate-500 font-medium text-sm">
          Acompanha o estado das tuas múltiplas em tempo real.
        </p>
      </div>

      <StatusWidget norteCount={2} sulCount={4} />
      <LiveTracker />
      <FinanceGrid />
      <RankingTeaser />
    </div>
  );
};

export default Dashboard;
