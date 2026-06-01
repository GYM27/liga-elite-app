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
        supabase.from("banca_transacoes").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("banca_transferencias").select("*").order("created_at", { ascending: false }).limit(20)
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

  const addManualTransaction = async ({ valor, tipo, descricao, jogador_id = null }) => {
    setSaving(true);
    try {
      const amount = Math.abs(Number(valor));
      const { error: tError } = await supabase.from("banca_transacoes").insert([
        {
          valor: amount,
          tipo,
          descricao: descricao.toUpperCase(),
          jogador_id,
          pago: true,
          created_at: new Date().toISOString(),
        },
      ]);
      if (tError) throw tError;

      const newCasa = partitions.casa + (tipo === "ENTRADA" ? amount : -amount);
      await supabase.from("banca_particoes").update({ casa_valor: newCasa }).eq("id", 1);
      
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

  return {
    loading,
    saving,
    partitions,
    transactions,
    transfers,
    addManualTransaction,
    executeTransfer,
    refresh: fetchFinanceData
  };
};
