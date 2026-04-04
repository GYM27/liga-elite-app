import React from 'react';
import { Clock } from 'lucide-react';

const StatusWidget = ({ norteCount = 0, sulCount = 0 }) => {
  const percentageNorte = (norteCount / 6) * 100;
  const percentageSul = (sulCount / 6) * 100;

  return (
    <section className="mb-8 space-y-6">
      {/* ProgressBar Norte */}
      <div className="space-y-2 group">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-slate-400 tracking-wider group-hover:text-primary transition-colors">LIGA NORTE</span>
          <span className="text-lg font-display font-bold text-white">{norteCount}<span className="text-slate-500 text-sm">/6</span></span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000 ease-out shadow-[0_0_12px_#22c55e44]"
            style={{ width: `${percentageNorte}%` }}
          ></div>
        </div>
      </div>

      {/* ProgressBar Sul */}
      <div className="space-y-2 group">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-slate-400 tracking-wider group-hover:text-primary transition-colors">LIGA SUL</span>
          <span className="text-lg font-display font-bold text-white">{sulCount}<span className="text-slate-500 text-sm">/6</span></span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000 ease-out shadow-[0_0_12px_#22c55e44]"
            style={{ width: `${percentageSul}%` }}
          ></div>
        </div>
      </div>

    </section>
  );
};

export default StatusWidget;
