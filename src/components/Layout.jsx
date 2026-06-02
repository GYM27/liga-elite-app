import React from "react";
import { Home, PlusSquare, Wallet, PieChart, Lock, Unlock, Users, ScrollText, Trophy, Settings, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { useEliteTime } from "../hooks/useEliteTime";
import { useDashboardData } from "../hooks/useDashboardData";
import AdminModal from "./AdminModal";
import PaymentReminderBanner from "./ui/PaymentReminderBanner";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, setShowAdminModal } = useAdmin();

  // Hook for date/time strings
  const { timeString, dayString, weekNumber, fullDateString } = useEliteTime();

  // Dashboard data for share button and payment reminder
  const { ranking, promovidos, descidos } = useDashboardData();
  const playersPending = ranking?.filter(p => p.mensalidade_paga === false) || [];

  const handleOpenAudit = (players) => {
    navigate('/estatisticas');
  };

  const handleShareWhatsApp = () => {
    const leader = ranking?.[0];
    const promNames = promovidos?.length > 0 ? promovidos.map(p => p.nome).join(', ') : 'Ninguém';
    const descNames = descidos?.length > 0 ? descidos.map(p => p.nome).join(', ') : 'Ninguém';
    const leaderText = leader ? `👑 *Líder:* ${leader.nome} com ${leader.total_greens || 0} Greens` : '';
    const text = `🏆 *RESUMO DA LIGA DE ELITE* 🏆\n\n${leaderText}\n\n🚀 *Promovidos à Elite:* ${promNames}\n📉 *Despromovidos ao Sul:* ${descNames}\n\n📲 *Acede à app para submeter o próximo palpite!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Trophy, label: "Ligas", path: "/classificacao" },
    { icon: ScrollText, label: "Bilhetes", path: "/bilhetes" },
    { icon: PlusSquare, label: "Palpites", path: "/novo-palpite" },
    { icon: Users, label: "Membros", path: "/membros" },
    { icon: Wallet, label: "Banca", path: "/financeiro" },
  ];

  return (
    <div className="min-h-screen pb-24 text-left">
      <AdminModal />

      {/* Payment reminder banner */}
      <PaymentReminderBanner players={playersPending} onOpenAudit={handleOpenAudit} />

      {/* Header */}
      <header className="sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <div className="flex flex-col text-left">
          <h1 className="text-lg sm:text-xl font-display font-bold tracking-tight text-white uppercase">
            <span className="text-[15px] italic">Liga de Elite</span>
          </h1>
          {/* DIA DA SEMANA + HORA vindos do Hook */}
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
            <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase italic">{dayString}</span>
            <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase italic">{fullDateString}</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-500 tabular-nums tracking-widest">{timeString}</span>
          </div>
        </div>

        {/* Right side: Live, share, history, admin, lock */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-xs font-semibold text-primary uppercase tracking-tighter">LIVE</span>
          </div>

          {isAdmin && (
            <button onClick={handleShareWhatsApp} className="p-1.5 sm:p-2 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-90" title="Partilhar no WhatsApp">
              <Share2 size={16} />
            </button>
          )}

          <button onClick={() => navigate('/historico')} className="p-1.5 sm:p-2 rounded-full border bg-slate-800/50 border-white/10 text-slate-400 hover:text-white transition-all active:scale-90" title="Museu Elite (Histórico)">
            <Trophy size={16} />
          </button>

          {isAdmin && (
            <button onClick={() => navigate('/configuracoes')} className="p-1.5 sm:p-2 rounded-full border bg-slate-800/50 border-white/10 text-slate-400 hover:text-white transition-all active:scale-90" title="Configurações Elite">
              <Settings size={16} />
            </button>
          )}

          <button onClick={() => setShowAdminModal(true)} className={`p-1.5 sm:p-2 rounded-full border transition-colors ${isAdmin ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
            {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 max-w-md mx-auto">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card py-3 px-6 flex justify-between items-center z-50">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={index} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-primary scale-110" : "text-slate-400 opacity-60 hover:opacity-100"}`}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;