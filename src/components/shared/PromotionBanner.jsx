import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { EliteAvatar } from '../ui';

const PromotionBanner = ({ lastPromotion, onDismiss }) => {
  useEffect(() => {
    if (!lastPromotion) return;
    const t = setTimeout(onDismiss, 30000);
    return () => clearTimeout(t);
  }, [lastPromotion, onDismiss]);

  if (!lastPromotion || (lastPromotion.promovidos.length === 0 && lastPromotion.descidos.length === 0)) return null;

  return (
    <div className="animate-in slide-in-from-top-4 fade-in duration-500 space-y-3 text-left">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
          Movimentos da Semana {lastPromotion.semana}
        </p>
        <button onClick={onDismiss} className="text-slate-600 hover:text-white transition-colors"><X size={16} /></button>
      </div>

      {lastPromotion.promovidos.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[28px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Promovidos → Liga Norte</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lastPromotion.promovidos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-3 py-2">
                <EliteAvatar src={p.foto_url} name={p.nome} size="xs" className="border-emerald-500/30" />
                <span className="text-[10px] font-black text-emerald-400 uppercase italic">{p.nome}</span>
                <span className="text-emerald-500 text-xs">⬆️</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastPromotion.descidos.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-[28px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-rose-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Descidos → Liga Sul</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lastPromotion.descidos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-3 py-2">
                <EliteAvatar src={p.foto_url} name={p.nome} size="xs" className="border-rose-500/30" />
                <span className="text-[10px] font-black text-rose-400 uppercase italic">{p.nome}</span>
                <span className="text-rose-500 text-xs">⬇️</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionBanner;
