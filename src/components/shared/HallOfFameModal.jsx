import React from 'react';
import { Award, Frown } from 'lucide-react';
import { EliteCard, EliteAvatar } from '../ui';

const HallOfFameModal = ({ isOpen, onClose, hallOfFame }) => {
  if (!isOpen || !hallOfFame) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in" onClick={onClose}></div>
      <div className="bg-slate-900 border-2 border-white/5 w-full max-w-2xl max-h-[85vh] rounded-[48px] overflow-hidden flex flex-col relative z-20 shadow-3xl animate-in zoom-in-95 duration-200">

        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="text-left">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Hall of Fame 🏛️</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Estatísticas Acumuladas da Época</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar scrollbar-hide">
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <Award className="text-yellow-500" size={24} />
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Reis da Época</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {hallOfFame.winners.slice(0, 6).map((w, i) => (
                <EliteCard key={i} variant="default" padding="p-5" className="flex items-center justify-between border-yellow-500/10">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-yellow-500 italic">#{i + 1}</span>
                    <EliteAvatar src={w.foto_url} name={w.nome} size="md" />
                    <p className="font-black uppercase tracking-tight italic text-white">{w.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">{w.wins} <span className="text-[10px]">🏆</span></p>
                  </div>
                </EliteCard>
              ))}
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <Frown className="text-rose-500" size={24} />
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Hall of Shame</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 opacity-80">
              {hallOfFame.losers.slice(0, 6).map((l, i) => (
                <EliteCard key={i} variant="default" padding="p-5" className="flex items-center justify-between border-rose-500/10">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-rose-500/50 mr-2">#{i + 1}</span>
                    <EliteAvatar src={l.foto_url} name={l.nome} size="sm" className="grayscale opacity-60" />
                    <p className="font-black uppercase tracking-tight italic text-slate-400">{l.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-rose-500/80">{l.loses} <span className="text-[10px]">🏮</span></p>
                  </div>
                </EliteCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallOfFameModal;
