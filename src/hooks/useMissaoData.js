import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDashboardData } from './useDashboardData';

export const useMissaoData = () => {
  const { currentWeek } = useDashboardData();
  const [campanha, setCampanha] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [votos, setVotos] = useState([]);
  const [historicoApostas, setHistoricoApostas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMissaoData = async () => {
    try {
      setLoading(true);
      // Get current active campaign
      const { data: campanhas, error: campErr } = await supabase
        .from('missao_campanhas')
        .select('*')
        .eq('status', 'ATIVA')
        .order('created_at', { ascending: false })
        .limit(1);

      if (campErr) throw campErr;
      const activeCampanha = campanhas?.[0] || null;
      setCampanha(activeCampanha);

      if (activeCampanha) {
        // Fetch proposals for the current week and campaign
        const { data: props, error: propsErr } = await supabase
          .from('missao_propostas')
          .select('*, jogador:jogadores(nome, foto_url)')
          .eq('campanha_id', activeCampanha.id)
          .eq('semana', currentWeek);
          
        if (propsErr) throw propsErr;
        setPropostas(props || []);

        // Fetch votes for the current week and campaign
        const { data: votes, error: votesErr } = await supabase
          .from('missao_votos')
          .select('*')
          .eq('campanha_id', activeCampanha.id)
          .eq('semana', currentWeek);
          
        if (votesErr) throw votesErr;
        setVotos(votes || []);
      }

      // Fetch ALL historical official bets (past and present)
      const { data: histData, error: histErr } = await supabase
        .from('missao_propostas')
        .select('*, jogador:jogadores(nome, foto_url)')
        .eq('oficial', true)
        .order('semana', { ascending: false });
        
      if (histErr) throw histErr;
      setHistoricoApostas(histData || []);

    } catch (err) {
      console.error('Erro a carregar dados da Missão:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWeek) {
      fetchMissaoData();
    }
  }, [currentWeek]);

  // Actions
  const addProposta = async (jogadorId, jogo, mercado, odd) => {
    if (!campanha || !currentWeek) return false;
    const { error } = await supabase.from('missao_propostas').insert([{
      campanha_id: campanha.id,
      jogador_id: jogadorId,
      semana: currentWeek,
      jogo,
      mercado,
      odd: parseFloat(odd)
    }]);
    if (!error) await fetchMissaoData();
    return !error;
  };

  const votar = async (jogadorId, propostaId) => {
    if (!campanha || !currentWeek) return false;
    // Check if already voted
    const alreadyVoted = votos.some(v => v.jogador_id === jogadorId);
    if (alreadyVoted) return false;

    const { error } = await supabase.from('missao_votos').insert([{
      campanha_id: campanha.id,
      semana: currentWeek,
      jogador_id: jogadorId,
      proposta_id: propostaId
    }]);
    if (!error) await fetchMissaoData();
    return !error;
  };

  const fecharVotacao = async (propostaId) => {
    // Set 'oficial' = true for the winning proposal
    const { error } = await supabase
      .from('missao_propostas')
      .update({ oficial: true })
      .eq('id', propostaId);
    
    if (!error) await fetchMissaoData();
    return !error;
  };

  const resolverApostaOficial = async (proposta, resultado, valorGanho = 0) => {
    if (!campanha) return false;
    
    // Update proposal result
    await supabase.from('missao_propostas').update({ resultado }).eq('id', proposta.id);

    // Update campaign
    if (resultado === 'GREEN') {
      const novaBanca = parseFloat(valorGanho);
      await supabase.from('missao_campanhas').update({ banca_atual: novaBanca }).eq('id', campanha.id);
    } else if (resultado === 'RED') {
      const novasVidas = campanha.vidas_restantes - 1;
      const status = novasVidas > 0 ? 'ATIVA' : 'FALHADA';
      await supabase.from('missao_campanhas').update({ 
        banca_atual: 5.00, // Reset to initial stake
        vidas_restantes: novasVidas,
        status
      }).eq('id', campanha.id);
    }
    
    await fetchMissaoData();
    return true;
  };

  const eliminarProposta = async (propostaId) => {
    const { error } = await supabase.from('missao_propostas').delete().eq('id', propostaId);
    if (!error) await fetchMissaoData();
    return !error;
  };

  const editarProposta = async (propostaId, jogo, mercado, odd) => {
    const { error } = await supabase
      .from('missao_propostas')
      .update({ jogo, mercado, odd: parseFloat(odd) })
      .eq('id', propostaId);
      
    if (!error) await fetchMissaoData();
    return !error;
  };

  return {
    campanha,
    propostas,
    votos,
    historicoApostas,
    loading,
    refresh: fetchMissaoData,
    addProposta,
    votar,
    fecharVotacao,
    resolverApostaOficial,
    eliminarProposta,
    editarProposta
  };
};
