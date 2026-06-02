import React, { useState, useEffect } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useAdmin } from "../context/AdminContext";
import {
  ArrowLeft, PieChart, TrendingUp, Wallet, PlusCircle,
  X, AlertCircle, UserCheck, Calendar, ChevronDown, ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { EliteCard, EliteButton, EliteAvatar } from "../components/ui";
import MemberAuditModal from "../components/shared/MemberAuditModal";
import { formatCurrency, getMonthLabel } from "../utils/formatters";

const Estatisticas = () => {
  const navigate = useNavigate();
  const {
    loading, fetchData, currentWeek, ranking, stats, pauseFines, togglePauseFinesGlobal
  } = useDashboardData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const [formData, setFormData] = useState({
    valor: "", tipo: "ENTRADA", descricao: "", jogador_id: "", pago: true,
  });
  const [saving, setSaving] = useState(false);

  const formattedMonthGlobal = getMonthLabel(new Date());

  // Lógica de provisionamento automático (semanal e mensal)
  useEffect(() => {
    const runProvisioning = async () => {
      if (!isAdmin || loading || ranking.length === 0) return;
      
      const today = new Date();
      // Multas semanais (Terça-feira em diante)
      if (!pauseFines && (today.getDay() >= 2 || today.getDay() === 0)) {
        try {
           const { data: multasExistentes } = await supabase.from("banca_transacoes").select("jogador_id").eq("tipo", "MULTA").like("descricao", `%Atraso s${currentWeek}%`);
           const idsComMulta = new Set((multasExistentes || []).map(m => m.jogador_id));
           const { data: palpitesSemana } = await supabase.from("palpites").select("jogador_id").eq("semana", currentWeek);
           const idsComPalpites = new Set((palpitesSemana || []).map(p => p.jogador_id));

           const novosDevedores = ranking.filter(p => !idsComPalpites.has(p.jogador_id) && !idsComMulta.has(p.jogador_id))
             .map(p => ({ valor: 1.0, tipo: "MULTA", descricao: `Multa Atraso s${currentWeek}`, pago: false, jogador_id: p.jogador_id, created_at: new Date().toISOString() }));

           if (novosDevedores.length > 0) {
             await supabase.from("banca_transacoes").insert(novosDevedores);
             fetchData();
           }
        } catch (e) { console.error(e); }
      }

      // Mensalidades
      try {
        const { data: existencias } = await supabase.from("mensalidades").select("jogador_id").eq("mes", formattedMonthGlobal);
        const idsPagos = new Set((existencias || []).map(e => e.jogador_id));
        const novosRegistos = ranking.filter(p => !idsPagos.has(p.jogador_id))
          .map(p => ({ jogador_id: p.jogador_id, mes: formattedMonthGlobal, pago: false }));
        
        if (novosRegistos.length > 0) {
          await supabase.from("mensalidades").insert(novosRegistos);
          fetchData();
        }
      } catch (e) { console.error(e); }
    };

    runProvisioning();
  }, [loading, ranking.length, currentWeek, isAdmin, pauseFines, fetchData, formattedMonthGlobal]);

  const handleShareGlobalReport = () => {
    const texto = ` *LIGA DE ELITE* \n *Relatório ${formattedMonthGlobal}*\n\n *PAGOS:*\n${ranking.filter((p) => !p.em_divida).map((p) => ` • ${p.nome}`).join("\n")}\n\n *DÍVIDAS:*\n${ranking.filter((p) => p.em_divida).map((p) => ` • ${p.nome}`).join("\n")}\n\n ELITE 🛡️⚡`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (loading) return <div className="text-white text-center mt-20 font-black uppercase text-xs tracking-widest italic">Sincronizando Elite...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10 max-w-lg mx-auto">
      <div className="text-center text-white text-sm font-black uppercase tracking-widest italic pt-2">
        {formattedMonthGlobal}
      </div>

      <div className="px-2 flex justify-between items-center text-left">
        <EliteButton variant="secondary" fullWidth={false} className="w-12" onClick={() => navigate(-1)} icon={ArrowLeft} />
        <h2 className="text-2xl font-black text-white uppercase italic flex items-center justify-center gap-2">
          <PieChart className="text-primary" size={24} />
          <span>Controlo de <span className="text-primary text-sm italic text-left">Mensalidades</span></span>
        </h2>
        {isAdmin && <EliteButton variant="secondary" fullWidth={false} className="w-12 text-primary" onClick={() => setIsAddModalOpen(true)} icon={PlusCircle} />}
      </div>

      <section className="px-2 space-y-4 text-left">
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
              <UserCheck size={22} /> MENSALIDADES
            </h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={togglePauseFinesGlobal} 
                  className={`px-3 h-8 border rounded-full text-[8px] font-black uppercase tracking-widest transition-colors ${pauseFines ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-white/5 border-white/10 text-slate-400"}`}
                >
                  {pauseFines ? "Multas Pausadas ⏸️" : "Pausar Multas"}
                </button>
              )}
              <button onClick={handleShareGlobalReport} className="px-3 h-8 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[8px] font-black uppercase tracking-widest">
                Enviar Relatório
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ranking.map((p) => (
            <EliteCard key={p.jogador_id} padding="p-3" variant={p.em_divida ? "danger" : "default"} onClick={() => setSelectedPlayer(p)} className="flex flex-col items-center">
              <EliteAvatar src={p.foto_url} name={p.nome} inDebt={p.em_divida} />
              <p className={`text-[10px] font-black uppercase text-center truncate w-full italic mt-2 ${p.em_divida ? "text-rose-500" : "text-emerald-400"}`}>
                {p.nome.split(" ")[0]}
              </p>
              {p.em_divida && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]"></div>}
            </EliteCard>
          ))}
        </div>
      </section>

      <div className="px-2 text-left">
        <EliteCard variant="primary" padding="p-8">
          <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] mb-2 italic">Saldo em Caixa Real</p>
          <p className="text-6xl font-display font-black text-white tracking-tighter italic">{formatCurrency(stats.saldo)}</p>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner shadow-primary/20">
            <Wallet size={32} />
          </div>
        </EliteCard>
      </div>

      <section className="px-2 space-y-4 text-left">
        <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-1 active:scale-95 transition-all">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-left">Histórico de Transações</h3>
          </div>
          {isHistoryOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </button>

        {isHistoryOpen && (
          <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {stats.transacoes?.slice().reverse().slice(0, 10).map((t, idx) => (
              <EliteCard key={t.id || idx} padding="p-5" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.pago ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {t.pago ? <TrendingUp size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white italic truncate max-w-[150px]">{t.descricao}</p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-widest">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "ELITE"}</p>
                  </div>
                </div>
                <p className={`text-lg font-display font-black tracking-tight ${t.pago ? "text-emerald-400" : "text-slate-500"}`}>
                  {t.tipo === "SAIDA" ? "-" : "+"}{formatCurrency(Math.abs(t.valor))}
                </p>
              </EliteCard>
            ))}
          </div>
        )}
      </section>

      {selectedPlayer && <MemberAuditModal player={selectedPlayer} isAdmin={isAdmin} onClose={() => setSelectedPlayer(null)} onActionComplete={fetchData} />}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <EliteCard className="w-full max-w-sm p-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                <AlertCircle size={20} className="text-rose-500" /> Lançar Multa Elite
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!formData.valor || !formData.descricao || !formData.jogador_id) return alert("Preenche todos os campos!");
              setSaving(true);
              try {
                const amount = Number(formData.valor.replace(",", "."));
                await supabase.from("banca_transacoes").insert([{ valor: amount, tipo: "MULTA", descricao: formData.descricao, jogador_id: formData.jogador_id, pago: false, created_at: new Date().toISOString() }]);
                setIsAddModalOpen(false);
                setFormData({ valor: "", tipo: "ENTRADA", descricao: "", jogador_id: "", pago: true });
                fetchData();
              } catch (err) { alert(err.message); } finally { setSaving(false); }
            }} className="space-y-5">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1">Membro Infrator</p>
                <select value={formData.jogador_id} onChange={(e) => setFormData({ ...formData, jogador_id: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-rose-500/30">
                  <option value="">-- SELECIONAR MEMBRO --</option>
                  {ranking.map((p) => <option key={p.jogador_id} value={p.jogador_id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1 text-center text-left">Valor (€)</p>
                  <input type="text" placeholder="1,00" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-2xl font-display font-black text-white text-center focus:border-rose-500/30" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase italic ml-1 text-left">Motivo / Descrição</p>
                  <input type="text" placeholder="Ex: Atraso s41" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-[11px] font-black text-white uppercase italic focus:border-rose-500/30 outline-none" />
                </div>
              </div>
              <EliteButton variant="danger" type="submit" disabled={saving}>
                {saving ? "A LANÇAR..." : "CONFIRMAR MULTA 🏁"}
              </EliteButton>
            </form>
          </EliteCard>
        </div>
      )}
    </div>
  );
};

export default Estatisticas;
