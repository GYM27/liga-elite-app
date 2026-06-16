import React, { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useFinance } from "../hooks/useFinance";
import {
  Wallet, PlusCircle, ArrowRightLeft, TrendingUp, TrendingDown,
  Landmark, Loader2, Calendar, ChevronDown, ChevronUp, Trash2
} from "lucide-react";
import { EliteCard, EliteButton, EliteBadge } from "../components/ui";
import { formatCurrency, formatDate } from "../utils/formatters";

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const { 
    loading, saving, partitions, transactions, transfers, 
    addManualTransaction, executeTransfer, undoMovement, refresh 
  } = useFinance();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transferencia, setTransferencia] = useState({ valor: "", de: "BANCO", para: "CASA" });
  const [manualMovement, setManualMovement] = useState({ valor: "", tipo: "ENTRADA", descricao: "", destino: "CASA" });

  const handleManualTransaction = async () => {
    if (!manualMovement.valor || !manualMovement.descricao) return;
    const res = await addManualTransaction(manualMovement);
    if (res.success) setManualMovement({ valor: "", tipo: "ENTRADA", descricao: "", destino: "CASA" });
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
        <EliteCard variant="glass" padding="p-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1 italic">Saldo em Caixa Total</p>
              <p className="text-5xl font-black text-white italic tracking-tighter">{formatCurrency(partitions.casa + partitions.banco)}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Wallet size={28} />
            </div>
          </div>
        </EliteCard>

        <div className="grid grid-cols-2 gap-3">
          <EliteCard variant="primary" padding="p-6">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-primary" />
                <p className="text-[9px] font-black text-primary/70 uppercase tracking-[0.2em] italic">Casa (🎰)</p>
              </div>
              <p className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(partitions.casa)}</p>
            </div>
          </EliteCard>

          <EliteCard variant="default" padding="p-6">
            <div className="flex flex-col justify-between h-full opacity-80">
              <div className="flex items-center gap-2 mb-3">
                <Landmark size={16} className="text-blue-400" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Banco (🏦)</p>
              </div>
              <p className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(partitions.banco)}</p>
            </div>
          </EliteCard>
        </div>
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

          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="0.00" value={manualMovement.valor} onChange={(e) => setManualMovement({ ...manualMovement, valor: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-xl font-black text-white text-center" />
            <select value={manualMovement.destino} onChange={(e) => setManualMovement({ ...manualMovement, destino: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-4 text-[10px] font-black text-white italic uppercase text-center appearance-none">
              <option value="CASA">🎰 DESTINO: CASA</option>
              <option value="BANCO">🏦 DESTINO: BANCO</option>
            </select>
          </div>
          <input type="text" placeholder="DESCRIÇÃO..." value={manualMovement.descricao} onChange={(e) => setManualMovement({ ...manualMovement, descricao: e.target.value })} className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white italic uppercase" />

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
            {[...transfers, ...transactions]
              .sort((a, b) => {
                const dA = new Date(a.created_at || a.data || a.data_movimento || Date.now());
                const dB = new Date(b.created_at || b.data || b.data_movimento || Date.now());
                return dB - dA;
              })
              .slice(0, 30)
              .map((t, idx) => {
                const isTransfer = !!t.de; // transferências têm 'de' e 'para'
                const d = new Date(t.created_at || t.data || t.data_movimento || Date.now());

                return (
                  <EliteCard key={t.id || idx} padding="p-5" className="flex items-center justify-between border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isTransfer ? "bg-primary/10 text-primary" : 
                        t.tipo === "SAIDA" || t.tipo === "LEVANTAMENTO" || t.tipo === "PREMIO" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {isTransfer ? <ArrowRightLeft size={16} /> : 
                         t.tipo === "SAIDA" || t.tipo === "LEVANTAMENTO" || t.tipo === "PREMIO" ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase italic max-w-[120px] truncate">
                          {isTransfer ? `${t.de} → ${t.para}` : t.descricao}
                        </p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{formatDate(d.toISOString())}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-lg font-display font-black italic ${
                        isTransfer ? "text-white" : 
                        t.tipo === "SAIDA" || t.tipo === "LEVANTAMENTO" || t.tipo === "PREMIO" ? "text-rose-500" : "text-emerald-500"
                      }`}>
                        {!isTransfer && (t.tipo === "ENTRADA" || t.tipo === "MENSALIDADE" || t.tipo === "MULTA" ? "+" : "-")}
                        {formatCurrency(t.valor)}
                      </p>
                      {isAdmin && (
                        <button 
                          onClick={() => { 
                            if(window.confirm("Tens a certeza que queres anular este movimento?")) {
                              undoMovement(t).then(res => {
                                if(!res.success) alert(res.error);
                              });
                            }
                          }} 
                          disabled={saving} 
                          className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors active:scale-90"
                          title="Anular Movimento"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </EliteCard>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Financeiro;
