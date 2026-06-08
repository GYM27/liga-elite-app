import React, { useState } from 'react';
import { X, Trash2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { EliteCard, EliteButton, EliteBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';

const MemberAuditModal = ({ player, onClose, isAdmin, onActionComplete }) => {
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!player) return null;

  const MESES_EPOCA = [
    "Junho 2026", "Julho 2026", "Agosto 2026", "Setembro 2026",
    "Outubro 2026", "Novembro 2026", "Dezembro 2026", "Janeiro 2027",
    "Fevereiro 2027", "Março 2027", "Abril 2027", "Maio 2027"
  ];

  const handlePayMonthly = async (monthLabel) => {
    if (!isAdmin) return;
    setLoading(true);
    setStatusMsg({ t: "PROCESSANDO...", c: "text-primary animate-pulse" });
    try {
      const { error: tErr } = await supabase.from("banca_transacoes").insert([
        {
          valor: 5.0,
          tipo: "MENSALIDADE",
          descricao: `Mensalidade ${monthLabel} - ${player.nome}`,
          jogador_id: player.jogador_id,
          pago: true,
          created_at: new Date().toISOString(),
        },
      ]);

      const { error: mErr } = await supabase.from("mensalidades").upsert(
        {
          jogador_id: player.jogador_id,
          mes: monthLabel,
          pago: true,
        },
        { onConflict: "jogador_id,mes" }
      );

      if (mErr || tErr) throw mErr || tErr;

      const { data: bP } = await supabase.from("banca_particoes").select("banco_valor").eq("id", 1).maybeSingle();
      if (bP) {
        await supabase.from("banca_particoes").update({ banco_valor: (Number(bP.banco_valor) || 0) + 5.0 }).eq("id", 1);
      }

      setStatusMsg({ t: "PAGO COM SUCESSO! 🏁", c: "text-emerald-500 font-bold" });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = async (debt) => {
    if (!isAdmin) return;
    setLoading(true);
    setStatusMsg({ t: "LIQUIDANDO...", c: "text-primary animate-pulse" });
    try {
      await supabase.from("banca_transacoes").update({ pago: true }).eq("id", debt.id);
      const { data: bP } = await supabase.from("banca_particoes").select("banco_valor").eq("id", 1).maybeSingle();
      if (bP) {
        await supabase.from("banca_particoes").update({
          banco_valor: (Number(bP.banco_valor) || 0) + Math.abs(debt.valor),
        }).eq("id", 1);
      }
      setStatusMsg({ t: "LIQUIDADO COM SUCESSO! ✅", c: "text-emerald-500 font-bold" });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async (debt) => {
    if (!isAdmin) return;
    if (!window.confirm("Deseja ANULAR esta dívida/multa permanentemente?")) return;
    setLoading(true);
    try {
      if (debt.descricao && debt.descricao.includes("Atraso s")) {
        // Para multas automáticas de atraso, atualizamos em vez de apagar
        // Isto previne que o script automático volte a inserir a multa nesta semana!
        await supabase.from("banca_transacoes").update({
          pago: true,
          valor: 0,
          descricao: debt.descricao + " [ANULADA]"
        }).eq("id", debt.id);
      } else {
        await supabase.from("banca_transacoes").delete().eq("id", debt.id);
      }
      setStatusMsg({ t: "DÍVIDA ANULADA! 🏮🏁", c: "text-rose-500 font-bold" });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ t: "ERRO: " + err.message, c: "text-rose-500" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm shadow-2xl">
      <EliteCard className="w-full max-w-sm p-8 space-y-6 shadow-2xl relative text-left" variant="default">
        <div className="flex justify-between items-start border-b border-white/5 pb-4">
          <div>
            <p className="text-white font-black text-[10px] uppercase tracking-widest italic underline decoration-primary underline-offset-4 leading-loose">
              Auditória de Membro
            </p>
            <h3 className="text-2xl font-black text-white mt-1 uppercase italic truncate w-48">
              {player.nome}
            </h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        </div>

        {statusMsg && (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 text-center animate-in zoom-in-95 duration-200">
            <p className={`text-[11px] font-black uppercase tracking-widest ${statusMsg.c}`}>
              {statusMsg.t}
            </p>
            <button onClick={() => setStatusMsg(null)} className="mt-2 text-[8px] font-black text-slate-500 uppercase underline">
              Fechar Aviso
            </button>
          </div>
        )}

        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide py-2">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] italic flex items-center gap-2 underline">
              Pendências Elite
            </p>

            <div className="space-y-3">
              {player.dividas_pendentes?.map((d) => (
                <div key={d.id} className="w-full bg-white/5 border-2 border-rose-500/30 p-5 rounded-[32px] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase italic">{d.descricao}</p>
                      <p className="text-2xl font-display font-black text-rose-500">{formatCurrency(Math.abs(d.valor))}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteDebt(d)} className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-90">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {isAdmin && (
                    <EliteButton variant="success" onClick={() => handlePayDebt(d)} icon={Check}>
                      PAGAR / LIQUIDAR
                    </EliteButton>
                  )}
                </div>
              ))}

              {MESES_EPOCA.map((m) => {
                const isPaid = player.historico_mensalidades?.[m];
                if (isPaid) return null;
                return (
                  <button
                    key={m}
                    onClick={() => handlePayMonthly(m)}
                    disabled={loading}
                    className="w-full p-5 rounded-[32px] border-2 bg-slate-950 border-rose-500/20 flex justify-between items-center transition-all active:scale-95 disabled:opacity-50"
                  >
                    <div>
                      <p className="text-[10px] font-black text-white uppercase italic">{m}</p>
                      <p className="text-2xl font-display font-black text-rose-400">5.00€</p>
                    </div>
                    <EliteBadge variant={isAdmin ? "primary" : "danger"} size="sm">
                      {isAdmin ? "LIQUIDAR" : "PENDENTE"}
                    </EliteBadge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </EliteCard>
    </div>
  );
};

export default MemberAuditModal;
