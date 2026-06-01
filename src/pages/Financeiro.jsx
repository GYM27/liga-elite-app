import React, { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useFinance } from "../hooks/useFinance";
import {
  Wallet, PlusCircle, ArrowRightLeft, TrendingUp, TrendingDown,
  Landmark, Loader2, Calendar, ChevronDown, ChevronUp
} from "lucide-react";
import { EliteCard, EliteButton, EliteBadge } from "../components/ui";
import { formatCurrency, formatDate } from "../utils/formatters";

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const { 
    loading, saving, partitions, transactions, transfers, 
    addManualTransaction, executeTransfer, refresh 
  } = useFinance();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transferencia, setTransferencia] = useState({ valor: "", de: "BANCO", para: "CASA" });
  const [manualMovement, setManualMovement] = useState({ valor: "", tipo: "ENTRADA", descricao: "" });

  const handleManualTransaction = async () => {
    if (!manualMovement.valor || !manualMovement.descricao) return;
    const res = await addManualTransaction(manualMovement);
    if (res.success) setManualMovement({ valor: "", tipo: "ENTRADA", descricao: "" });
    else alert(res.error);
  };

  const handleTransfer = async () => {
    if (!transferencia.valor) return;
    const res = await executeTransfer(transferencia);
    if (res.success) setTransferencia({ ...transferencia, valor: "" });
    else alert(res.error);
  };

  if (loading) return <div className="text-white text-center mt-20 font-black uppercase text-xs animate-pulse">Sincronizando Banca...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-2 max-w-lg mx-auto">
      <div className="pt-4 text-left">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <Wallet className="text-primary" size={28} />
          <span>Tesouraria <span className="text-primary tracking-widest text-xl">Elite</span></span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 text-left">
        <EliteCard variant="primary" padding="p-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] mb-1 italic">Valor na Casa de Apostas (🎰)</p>
              <p className="text-5xl font-black text-white italic tracking-tighter">{formatCurrency(partitions.casa)}</p>
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <TrendingUp size={28} />
            </div>
          </div>
        </EliteCard>

        <EliteCard variant="default" padding="p-8">
          <div className="flex justify-between items-center opacity-80">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">Conta Bancária (🏦)</p>
              <p className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(partitions.banco)}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Landmark size={28} />
            </div>
          </div>
        </EliteCard>
      </div>

      {isAdmin && (
        <EliteCard variant="success" className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
              <TrendingUp size={20} /> Lançamento de Caixa
            </h3>
            <div className="flex bg-slate-950 rounded-2xl p-1 border border-white/5">
              <button onClick={() => setManualMovement({ ...manualMovement, tipo: "ENTRADA" })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${manualMovement.tipo === "ENTRADA" ? "bg-emerald-500 text-slate-950" : "text-slate-500"}`}>ENTRADA</button>
              <button onClick={() => setManualMovement({ ...manualMovement, tipo: "SAIDA" })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${manualMovement.tipo === "SAIDA" ? "bg-rose-500 text-white" : "text-slate-500"}`}>SAÍDA</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="0.00" value={manualMovement.valor} onChange={(e) => setManualMovement({ ...manualMovement, valor: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-xl font-black text-white text-center" />
            <input type="text" placeholder="DESCRIÇÃO..." value={manualMovement.descricao} onChange={(e) => setManualMovement({ ...manualMovement, descricao: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white italic uppercase" />
          </div>

          <EliteButton variant={manualMovement.tipo === "ENTRADA" ? "success" : "danger"} onClick={handleManualTransaction} disabled={saving} icon={PlusCircle}>
            {saving ? "A PROCESSAR..." : "CONFIRMAR MOVIMENTO"}
          </EliteButton>
        </EliteCard>
      )}

      {isAdmin && (
        <EliteCard variant="dark" className="p-8 space-y-6">
          <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center justify-center gap-3">
            <ArrowRightLeft className="text-primary" size={20} /> Transferência Interna
          </h3>

          <div className="grid grid-cols-[1fr_30px_1fr] items-center gap-3">
            <select value={transferencia.de} onChange={(e) => setTransferencia({ ...transferencia, de: e.target.value })} className="bg-slate-900 border border-white/5 rounded-2xl h-14 px-3 text-[10px] font-black text-white">
              <option value="BANCO">🏦 BANCO</option>
              <option value="CASA">🎰 CASA</option>
            </select>
            <ArrowRightLeft size={16} className="text-primary/30 mx-auto" />
            <select value={transferencia.para} onChange={(e) => setTransferencia({ ...transferencia, para: e.target.value })} className="bg-slate-900 border border-white/5 rounded-2xl h-14 px-3 text-[10px] font-black text-white">
              <option value="CASA">🎰 CASA</option>
              <option value="BANCO">🏦 BANCO</option>
            </select>
          </div>

          <input type="number" placeholder="MONTANTE..." value={transferencia.valor} onChange={(e) => setTransferencia({ ...transferencia, valor: e.target.value })} className="w-full h-14 bg-slate-900 border border-white/5 rounded-2xl px-6 text-lg font-black text-white text-center italic" />

          <EliteButton onClick={handleTransfer} disabled={saving} icon={ArrowRightLeft}>
            EXECUTAR TRANSFERÊNCIA
          </EliteButton>
        </EliteCard>
      )}

      <section className="space-y-4 px-1 text-left">
        <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between group active:scale-95 transition-all">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Histórico da Banca</h3>
          </div>
          {isHistoryOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </button>

        {isHistoryOpen && (
          <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
            {transfers.map((t, idx) => (
              <EliteCard key={t.id || idx} padding="p-5" className="flex items-center justify-between border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <ArrowRightLeft size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase italic">{t.de} → {t.para}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{formatDate(t.created_at || t.data)}</p>
                  </div>
                </div>
                <p className="text-xl font-display font-black text-white italic">{formatCurrency(t.valor)}</p>
              </EliteCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Financeiro;
