import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useFinance = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partitions, setPartitions] = useState({ banco: 0, casa: 0 });
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { data: tData }, { data: trData }] = await Promise.all([
        supabase.from("banca_particoes").select("*").eq("id", 1).maybeSingle(),
        supabase.from("banca_transacoes").select("*").eq("pago", true).order("data_movimento", { ascending: false }).limit(50),
        supabase.from("banca_transferencias").select("*").order("data", { ascending: false }).limit(20)
      ]);

      if (pData) {
        setPartitions({
          banco: Number(pData.banco_valor) || 0,
          casa: Number(pData.casa_valor) || 0,
        });
      }
      setTransactions(tData || []);
      setTransfers(trData || []);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const addManualTransaction = async ({ valor, tipo, descricao, jogador_id = null, destino = "CASA" }) => {
    setSaving(true);
    try {
      const amount = Math.abs(Number(valor));
      const prefixo = destino === "BANCO" ? "[BANCO] " : "[CASA] ";
      
      const { error: tError } = await supabase.from("banca_transacoes").insert([
        {
          valor: amount,
          tipo,
          descricao: `${prefixo}${descricao.toUpperCase()}`,
          jogador_id,
          pago: true,
          data_movimento: new Date().toISOString(),
        },
      ]);
      if (tError) throw tError;

      const updates = {};
      const amountToAdd = tipo === "ENTRADA" ? amount : -amount;
      
      if (destino === "BANCO") {
        updates.banco_valor = partitions.banco + amountToAdd;
      } else {
        updates.casa_valor = partitions.casa + amountToAdd;
      }

      await supabase.from("banca_particoes").update(updates).eq("id", 1);
      
      await fetchFinanceData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const executeTransfer = async ({ valor, de, para }) => {
    setSaving(true);
    try {
      const amount = Math.abs(Number(valor));
      if (amount <= 0) throw new Error("Montante inválido");

      const { error: trError } = await supabase.from("banca_transferencias").insert([{
        valor: amount,
        de,
        para,
        data: new Date().toISOString()
      }]);
      if (trError) throw trError;

      const updates = {};
      if (de === "BANCO") updates.banco_valor = partitions.banco - amount;
      else updates.casa_valor = partitions.casa - amount;

      if (para === "BANCO") updates.banco_valor = (updates.banco_valor || partitions.banco) + amount;
      else updates.casa_valor = (updates.casa_valor || partitions.casa) + amount;

      await supabase.from("banca_particoes").update(updates).eq("id", 1);
      
      await fetchFinanceData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const undoMovement = async (movement) => {
    setSaving(true);
    try {
      const amount = Math.abs(Number(movement.valor));
      const updates = {};
      
      if (movement.de && movement.para) {
        // Transferência
        if (movement.de === "BANCO") updates.banco_valor = partitions.banco + amount;
        else updates.casa_valor = partitions.casa + amount;
        
        if (movement.para === "BANCO") updates.banco_valor = (updates.banco_valor || partitions.banco) - amount;
        else updates.casa_valor = (updates.casa_valor || partitions.casa) - amount;

        const { error: delErr } = await supabase.from("banca_transferencias").delete().eq("id", movement.id);
        if (delErr) throw delErr;
      } else if (movement.tipo) {
        // Transação
        const isBanco = movement.descricao?.includes("[BANCO]") || movement.tipo === "MENSALIDADE" || movement.tipo === "MULTA";
        
        if (movement.tipo === "ENTRADA" || movement.tipo === "MENSALIDADE" || movement.tipo === "MULTA") {
          if (isBanco) updates.banco_valor = partitions.banco - amount;
          else updates.casa_valor = partitions.casa - amount;
        } else {
          // SAIDA, LEVANTAMENTO, PREMIO
          if (isBanco) updates.banco_valor = partitions.banco + amount;
          else updates.casa_valor = partitions.casa + amount;
        }
        
        const { error: delErr } = await supabase.from("banca_transacoes").delete().eq("id", movement.id);
        if (delErr) throw delErr;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("banca_particoes").update(updates).eq("id", 1);
      }
      
      await fetchFinanceData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    partitions,
    transactions,
    transfers,
    addManualTransaction,
    executeTransfer,
    undoMovement,
    refresh: fetchFinanceData
  };
};
