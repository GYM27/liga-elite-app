import React from 'react';
import { EliteAvatar } from '../ui';
import { Link } from 'react-router-dom';

const ElitePodium = ({ players = [], label = "Líderes" }) => {
  const top3 = players.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-2 mb-10 mt-6 h-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 2º LUGAR */}
      {top3[1] && (
        <Link to={`/perfil/${top3[1].jogador_id || top3[1].id}`} className="flex flex-col items-center flex-1 pb-2 group transition-transform hover:scale-105 hover:z-20 cursor-pointer">
          <div className="relative mb-2 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
            <EliteAvatar src={top3[1].foto_url} name={top3[1].nome} size="md" className="border-slate-400/50" />
            <div className="absolute -bottom-2 -right-1 bg-slate-400 text-slate-950 text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">2º</div>
          </div>
          <p className="text-[9px] font-black text-white uppercase truncate w-20 text-center italic">{top3[1].nome.split(' ')[0]}</p>
          <p className="text-[11px] font-black text-primary">{top3[1].total_greens || top3[1].wins || 0} <span className="text-[7px] text-slate-500 uppercase">{top3[1].wins ? 'VIT' : 'GRN'}</span></p>
        </Link>
      )}

      {/* 1º LUGAR */}
      {top3[0] && (
        <Link to={`/perfil/${top3[0].jogador_id || top3[0].id}`} className="flex flex-col items-center flex-1 z-10 scale-110 group transition-transform hover:scale-110 hover:z-20 cursor-pointer">
          <div className="relative mb-3 group-hover:drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
            <EliteAvatar src={top3[0].foto_url} name={top3[0].nome} size="lg" className="border-yellow-500 shadow-xl shadow-yellow-500/20" />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full border-2 border-slate-900 shadow-lg">REI</div>
            <div className="absolute -bottom-2 -right-1 bg-yellow-500 text-slate-950 text-[9px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900">1º</div>
          </div>
          <p className="text-[11px] font-black text-white uppercase truncate w-24 text-center italic tracking-tight">{top3[0].nome.split(' ')[0]}</p>
          <p className="text-sm font-black text-primary">{top3[0].total_greens || top3[0].wins || 0} <span className="text-[8px] text-slate-500 uppercase">{top3[0].wins ? 'VIT' : 'GRN'}</span></p>
        </Link>
      )}

      {/* 3º LUGAR */}
      {top3[2] && (
        <Link to={`/perfil/${top3[2].jogador_id || top3[2].id}`} className="flex flex-col items-center flex-1 pb-2 group transition-transform hover:scale-105 hover:z-20 cursor-pointer">
          <div className="relative mb-2 group-hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
            <EliteAvatar src={top3[2].foto_url} name={top3[2].nome} size="md" className="border-amber-700/50" />
            <div className="absolute -bottom-2 -right-1 bg-amber-700 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">3º</div>
          </div>
          <p className="text-[9px] font-black text-white uppercase truncate w-20 text-center italic">{top3[2].nome.split(' ')[0]}</p>
          <p className="text-[11px] font-black text-primary">{top3[2].total_greens || top3[2].wins || 0} <span className="text-[7px] text-slate-500 uppercase">{top3[2].wins ? 'VIT' : 'GRN'}</span></p>
        </Link>
      )}
    </div>
  );
};

export default ElitePodium;
