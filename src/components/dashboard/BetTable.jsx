import React from 'react';
import { Trophy, Users, Activity, TrendingUp } from 'lucide-react';

const BetTable = ({ palpites = [], title, type = 'norte' }) => {
  if (palpites.length === 0) return null;

  const colorClass = type === 'norte' ? 'text-blue-400' : 'text-orange-400';
  const borderClass = type === 'norte' ? 'border-blue-500/20' : 'border-orange-500/20';
  const bgClass = type === 'norte' ? 'bg-blue-500/5' : 'bg-orange-500/5';

  return (
    <div className={`rounded-2xl border ${borderClass} ${bgClass} overflow-hidden mb-6`}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${colorClass}`}>
          <Trophy size={14} /> {title}
        </h3>
        <span className="text-[10px] text-slate-500 font-bold uppercase">{palpites.length} Apostas</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">Apostador</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">Jogo (Casa vs Fora)</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">Prognóstico</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-right">Odd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {palpites.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.jogadores?.foto_url ? (
                      <img src={p.jogadores.foto_url} alt="" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-white/5">
                        {p.jogadores?.nome?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                      {p.jogadores?.nome}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-white font-medium text-right flex-1 truncate max-w-[80px]">{p.equipa_casa || p.jogo?.split(' vs ')[0] || '-'}</span>
                    <span className="text-[10px] text-slate-600 font-black italic">VS</span>
                    <span className="text-white font-medium text-left flex-1 truncate max-w-[80px]">{p.equipa_fora || p.jogo?.split(' vs ')[1] || '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${
                    p.resultado_individual === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
                    p.resultado_individual === 'RED' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {p.aposta || 'Pendente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-display font-black text-primary tabular-nums">
                    {Number(p.odd || 1.0).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BetTable;
