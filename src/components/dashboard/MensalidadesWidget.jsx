import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, UserX } from 'lucide-react';

const MensalidadesWidget = ({ players = [] }) => {
  const paidCount = players.filter(p => p.mensalidade_paga).length;
  const inDebt = players.filter(p => p.em_divida);
  const totalCount = players.length;

  return (
    <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
        <h2 className="text-sm font-black font-display tracking-widest text-white/90 uppercase italic">Controlo de Mensalidades</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Sumário */}
        <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 flex items-center justify-between group hover:bg-slate-900/80 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Estado do Mês</p>
              <h3 className="text-white font-display font-black text-2xl uppercase italic tracking-tighter mt-0.5">
                {paidCount} <span className="text-slate-600 text-sm italic">/ {totalCount} PAGOS</span>
              </h3>
            </div>
          </div>
          
          <div className="flex -space-x-3 overflow-hidden">
            {players.filter(p => p.mensalidade_paga).slice(0, 5).map((p, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden shrink-0">
                {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-500">{p.nome?.substring(0,2)}</div>}
              </div>
            ))}
            {paidCount > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-400 shrink-0">
                +{paidCount - 5}
              </div>
            )}
          </div>
        </div>

        {/* Alerta de Dívidas */}
        {inDebt.length > 0 && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-[32px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-rose-500" />
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Atenção Necessária ({inDebt.length})</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {inDebt.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/10 rounded-xl px-3 py-1.5 group hover:bg-rose-500/20 transition-all">
                  <div className="w-5 h-5 rounded-lg overflow-hidden grayscale opacity-70">
                    {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[6px] font-black text-rose-500 bg-slate-900">{p.nome?.substring(0,2)}</div>}
                  </div>
                  <span className="text-[10px] font-black text-rose-400 uppercase italic tracking-tight">{p.nome?.split(' ')[0]}</span>
                  <UserX size={12} className="text-rose-500/40" />
                </div>
              ))}
            </div>
          </div>
        )}

        {inDebt.length === 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-6 flex items-center justify-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest italic">Todas as contas em dia. Excelente!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MensalidadesWidget;
