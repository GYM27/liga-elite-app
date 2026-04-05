import React, { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { supabase } from "../lib/supabaseClient";
import {
  Wallet,
  PlusCircle,
  ArrowRightLeft,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  Loader2,
  Calendar,
  ShieldCheck,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const {
    nortePalpites,
    sulPalpites,
    loading: dashLoading,
    fetchData,
    currentWeek,
  } = useDashboardData();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [manualTransactions, setManualTransactions] = useState([]);
  const [mensalidadesTotal, setMensalidadesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState({
    valor: "",
    de: "BANCO",
    para: "CASA",
  });
  const [manualMovement, setManualMovement] = useState({
    valor: "",
    tipo: "ENTRADA",
    descricao: "",
  });
  const [saving, setSaving] = useState(false);
  const [bases, setBases] = useState({ banco: 271.0, casa: 143.3 });

  const STAKE_PER_TICKET = 5.0;

  const fetchFinanceData = async () => {
    try {
      // Pedidos limpos sem ordenação para evitar Erro 400
      const { data: tData, error: tError } = await supabase
        .from("banca_transferencias")
        .select("*");
      const { data: mData, error: mError } = await supabase
        .from("mensalidades")
        .select("valor_pago")
        .eq("pago", true);
      const { data: bT, error: bE } = await supabase
        .from("banca_transacoes")
        .select("*");
      const { data: bP, error: bP_E } = await supabase
        .from("banca_particoes")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (tError) console.error("Erro Transf:", tError);
      if (mError) console.error("Erro Mensalidades:", mError);
      if (bE) console.error("Erro Banca Transacoes:", bE);

      if (bP) {
        setBases({
          banco: Number(bP.banco_valor) || 0,
          casa: Number(bP.casa_valor) || 0,
        });
      }

      // Ordenação segura em memória
      const sortedTransfers = (tData || []).sort(
        (a, b) =>
          new Date(b.created_at || b.data || b.id || 0) -
          new Date(a.created_at || a.data || a.id || 0),
      );
      const sortedManual = (bT || []).sort(
        (a, b) =>
          new Date(b.created_at || b.data || b.id || 0) -
          new Date(a.created_at || a.data || a.id || 0),
      );

      setTransfers(sortedTransfers.slice(0, 20));
      setManualTransactions(sortedManual.slice(0, 20));
      const totalM = (mData || []).reduce(
        (acc, m) => acc + (Number(m.valor_pago) || 0),
        0,
      );
      setMensalidadesTotal(totalM);
    } catch (err) {
      console.error("Crash Financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // REGRA DE OURO DA CASA (CALCULO DE JOGO)
  const calcPrizes = (palpites) => {
    if (palpites.length === 0) return { stake: 0, win: 0 };
    const oddsV = palpites.filter((p) => p.odd && Number(p.odd) > 0);
    const oddG = oddsV.reduce((acc, p) => acc * Number(p.odd), 1);
    const isWon = palpites.every((p) => p.resultado_individual === "GREEN");
    return {
      stake: STAKE_PER_TICKET,
      win: isWon ? oddG * STAKE_PER_TICKET : 0,
    };
  };

  const resNorte = calcPrizes(nortePalpites);
  const resSul = calcPrizes(sulPalpites);

  // CALCULOS DE PARTIÇÃO (DINÂMICOS E AUTOMÁTICOS)
  const totalInternalDeBanco = transfers
    .filter((t) => t.origem === "BANCO")
    .reduce((acc, t) => acc + Number(t.valor), 0);
  const totalInternalParaBanco = transfers
    .filter((t) => t.destino === "BANCO")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const manualInputsBanco = manualTransactions
    .filter(
      (t) =>
        t.pago !== false &&
        (t.tipo === "ENTRADA" ||
          t.tipo === "MENSALIDADE" ||
          t.tipo === "PREMIO"),
    )
    .reduce((acc, t) => acc + Number(t.valor), 0);
  const manualOutputsBanco = manualTransactions
    .filter(
      (t) =>
        t.pago !== false &&
        (t.tipo === "SAIDA" || t.tipo === "MULTA" || t.tipo === "LEVANTAMENTO"),
    )
    .reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);

  const totalInternalDeCasa = transfers
    .filter((t) => t.origem === "CASA")
    .reduce((acc, t) => acc + Number(t.valor), 0);
  const totalInternalParaCasa = transfers
    .filter((t) => t.destino === "CASA")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  // BANCO E CASA: SOMA ABSOLUTA DO COFRE (Fonte: Partições DB)
  // O saldo agora reflete o capital total liquidado (271.00€ e 143.30€).
  const saldoBancoReal = bases.banco;
  const saldoCasaReal = bases.casa;

  const handleManualTransaction = async () => {
    if (!isAdmin || !manualMovement.valor || !manualMovement.descricao) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("banca_transacoes").insert([
        {
          valor: Number(manualMovement.valor),
          tipo: manualMovement.tipo,
          descricao: manualMovement.descricao,
          pago: true,
          created_at: new Date(),
        },
      ]);
      if (error) throw error;

      // ATUALIZAÇÃO ATIVA DO COFRE
      const novoBanco =
        manualMovement.tipo === "ENTRADA"
          ? bases.banco + Number(manualMovement.valor)
          : bases.banco - Number(manualMovement.valor);
      await supabase
        .from("banca_particoes")
        .update({ banco_valor: novoBanco })
        .eq("id", 1);

      setManualMovement({ valor: "", tipo: "ENTRADA", descricao: "" });
      await fetchFinanceData();
      await fetchData();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (
      !isAdmin ||
      !transferencia.valor ||
      transferencia.de === transferencia.para
    )
      return;
    setSaving(true);
    const val = Number(transferencia.valor);
    try {
      const { error: tError } = await supabase
        .from("banca_transferencias")
        .insert({
          origem: transferencia.de,
          destino: transferencia.para,
          valor: val,
          created_at: new Date(),
        });
      if (tError) throw tError;

      // ATUALIZAÇÃO ATIVA DO COFRE (MOVER FUNDOS)
      let nB = bases.banco;
      let nC = bases.casa;
      if (transferencia.de === "BANCO") {
        nB -= val;
        nC += val;
      } else {
        nB += val;
        nC -= val;
      }

      await supabase
        .from("banca_particoes")
        .update({ banco_valor: nB, casa_valor: nC })
        .eq("id", 1);

      alert("Cofre Atualizado: Transferência Master OK! 🏁💰");
      setTransferencia({ valor: "", de: "BANCO", para: "CASA" });
      fetchFinanceData();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || dashLoading)
    return (
      <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs italic tracking-[0.2em]">
        Auditando Tesouraria Master...
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-10 pb-20 px-4 max-w-lg mx-auto overflow-x-hidden">
      <div className="mb-2">
        <h2 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
          <Wallet className="text-primary" size={40} />
          <span>Tesouraria</span>
        </h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1 italic font-display">
          Semana {currentWeek} de Operações
        </p>
      </div>

      {/* SALDO TOTAL ACUMULADO */}
      <div className="relative group overflow-hidden bg-slate-900 border-2 border-primary/20 rounded-[50px] p-10 shadow-2xl text-center transition-all hover:bg-slate-950">
        <p className="text-primary/40 text-[9px] font-black uppercase tracking-[0.4em] mb-4 italic">
          Capital Total da Liga
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-6xl font-display font-black text-white tabular-nums tracking-tighter italic">
            {(saldoBancoReal + saldoCasaReal).toFixed(2)}
          </span>
          <span className="text-3xl font-bold text-primary">€</span>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
          <DollarSign size={150} />
        </div>
      </div>

      {/* PARTIÇÕES */}
      <div className="space-y-4">
        <div className="bg-slate-700 border-2 border-white rounded-[40px] p-2 shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-4 p-2">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Activity size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                  Casa de Apostas
                </p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">
                  {saldoCasaReal.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-700 border-2 border-white rounded-[40px] p-2 shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-4 p-2">
              <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Landmark size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                  Conta Bancária
                </p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">
                  {saldoBancoReal.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LANÇAMENTO MANUAL DE CAIXA */}
      {isAdmin && (
        <div className="bg-slate-900 border-2 border-emerald-500/20 rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
              <TrendingUp className="text-emerald-500" size={20} /> Lançamento
              de Caixa
            </h3>
            <div className="flex bg-slate-950 rounded-2xl p-1 border border-white/5">
              <button
                onClick={() =>
                  setManualMovement({ ...manualMovement, tipo: "ENTRADA" })
                }
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${manualMovement.tipo === "ENTRADA" ? "bg-emerald-500 text-slate-950" : "text-slate-500"}`}
              >
                ENTRADA
              </button>
              <button
                onClick={() =>
                  setManualMovement({ ...manualMovement, tipo: "SAIDA" })
                }
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${manualMovement.tipo === "SAIDA" ? "bg-rose-500 text-white" : "text-slate-500"}`}
              >
                SAÍDA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-14">
              <input
                type="number"
                placeholder="0.00"
                value={manualMovement.valor}
                onChange={(e) =>
                  setManualMovement({
                    ...manualMovement,
                    valor: e.target.value,
                  })
                }
                className="w-full h-full bg-slate-950 border border-white/10 rounded-2xl px-4 text-xl font-display font-black text-white outline-none focus:border-emerald-500/30 text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500 opacity-50">
                €
              </span>
            </div>
            <input
              type="text"
              placeholder="Descrição..."
              value={manualMovement.descricao}
              onChange={(e) =>
                setManualMovement({
                  ...manualMovement,
                  descricao: e.target.value,
                })
              }
              className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white outline-none focus:border-emerald-500/30 italic uppercase"
            />
          </div>

          <button
            onClick={handleManualTransaction}
            disabled={saving}
            className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${manualMovement.tipo === "ENTRADA" ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"}`}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <PlusCircle size={16} /> CONFIRMAR MOVIMENTO
              </>
            )}
          </button>
        </div>
      )}

      {/* TRANSFERÊNCIA INTERNA */}
      {isAdmin && (
        <div className="bg-slate-950/50 border-2 border-primary/10 rounded-[40px] p-8 space-y-6">
          <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center justify-center gap-3">
            <ArrowRightLeft className="text-primary" size={20} /> Transferência
            Interna
          </h3>

          <div className="grid grid-cols-[1fr_30px_1fr] items-center gap-3">
            <select
              value={transferencia.de}
              onChange={(e) =>
                setTransferencia({ ...transferencia, de: e.target.value })
              }
              className="bg-slate-900 border border-white/5 rounded-2xl h-14 px-3 text-[10px] font-black text-white outline-none"
            >
              <option value="BANCO">🏦 BANCO</option>
              <option value="CASA">🎰 CASA</option>
            </select>
            <ArrowRightLeft size={16} className="text-primary/30 mx-auto" />
            <select
              value={transferencia.para}
              onChange={(e) =>
                setTransferencia({ ...transferencia, para: e.target.value })
              }
              className="bg-slate-900 border border-white/5 rounded-2xl h-14 px-3 text-[10px] font-black text-white outline-none"
            >
              <option value="CASA">🎰 CASA</option>
              <option value="BANCO">🏦 BANCO</option>
            </select>
          </div>

          <div className="relative h-14">
            <input
              type="number"
              placeholder="Montante..."
              className="w-full h-full bg-slate-900 border border-white/5 rounded-2xl px-6 text-lg font-black text-white outline-none text-center italic"
              value={transferencia.valor}
              onChange={(e) =>
                setTransferencia({ ...transferencia, valor: e.target.value })
              }
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={saving}
            className="w-full h-14 bg-primary text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all"
          >
            {saving ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "EXECUTAR TRANSFERÊNCIA"
            )}
          </button>
        </div>
      )}

      {/* HISTÓRICO UNIFICADO COM DROPDOWN */}
      <div className="space-y-6">
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex justify-between items-center px-4 active:scale-95 transition-all group"
        >
          <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] italic flex items-center gap-3">
            <History size={18} className="text-primary" /> Livro de Registos
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic">
              {isHistoryOpen ? "Recolher" : "Expandir"}
            </span>
            {isHistoryOpen ? (
              <ChevronUp size={16} className="text-slate-500" />
            ) : (
              <ChevronDown size={16} className="text-slate-500" />
            )}
          </div>
        </button>

        {isHistoryOpen && (
          <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
            {[...transfers, ...manualTransactions]
              .sort((a, b) => {
                const dA = new Date(a.created_at || a.data || Date.now());
                const dB = new Date(b.created_at || b.data || Date.now());
                return dB - dA;
              })
              .slice(0, 30)
              .map((t, idx) => {
                const isTransfer = !!t.origem;
                const d = new Date(t.created_at || t.data || Date.now());
                const dataValida = !isNaN(d.getTime()) ? d : new Date();

                return (
                  <div
                    key={t.id || idx}
                    className="bg-slate-900 border border-white/5 rounded-[32px] p-6 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isTransfer
                            ? "bg-white/5 text-slate-500"
                            : t.tipo === "SAIDA"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {isTransfer ? (
                          <ArrowRightLeft size={18} />
                        ) : t.tipo === "SAIDA" ? (
                          <TrendingDown size={18} />
                        ) : (
                          <TrendingUp size={18} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {isTransfer ? (
                            <p className="text-[9px] font-black text-white uppercase italic">
                              {t.origem} → {t.destino}
                            </p>
                          ) : (
                            <p className="text-[9px] font-black text-white uppercase italic tracking-widest">
                              {t.tipo}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 italic mt-0.5 truncate max-w-[120px]">
                          {t.descricao || "Trf Interna"}
                        </p>
                        <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 flex items-center gap-2 tracking-widest text-left">
                          <Calendar size={10} />{" "}
                          {dataValida.toLocaleDateString("pt-PT")}{" "}
                          <span className="opacity-20">•</span>{" "}
                          {dataValida.toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-display font-black italic tracking-tighter ${
                          isTransfer
                            ? "text-white"
                            : t.tipo === "SAIDA" ||
                                t.tipo === "LEVANTAMENTO" ||
                                t.tipo === "MULTA"
                              ? "text-rose-500"
                              : "text-emerald-500"
                        }`}
                      >
                        {!isTransfer &&
                          (t.tipo === "ENTRADA" ||
                          t.tipo === "MENSALIDADE" ||
                          t.tipo === "PREMIO"
                            ? "+"
                            : "-")}
                        {Number(t.valor).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Financeiro;
