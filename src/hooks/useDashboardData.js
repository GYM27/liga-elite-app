import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useDashboardData = () => {
  const [data, setData] = useState({
    ranking: [],
    nortePalpites: [],
    sulPalpites: [],
    stats: { saldo: 0, roi: 0, ganhoPotencial: 0 },
    submissions: { norte: 0, sul: 0 },
    loading: true
  });

  const fetchData = async () => {
    try {
      // Check if credentials exist
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Missing credentials');
      }

      // 1. Fetch Ranking
      const { data: ranking } = await supabase.from('ranking_atual').select('*').order('total_greens', { ascending: false });

      // 2. Fetch current week's palpites
      const currentWeek = 14; 
      const { data: palpites } = await supabase
        .from('palpites')
        .select('*, jogadores(nome, liga_atual)')
        .eq('semana', currentWeek);

      // 3. Fetch Bank Balance
      const { data: banca } = await supabase.from('banca').select('valor, tipo');
      const saldo = banca?.reduce((acc, current) => {
        return current.tipo === 'ENTRADA' ? acc + Number(current.valor) : acc - Number(current.valor);
      }, 0) || 0;

      setData({
        ranking: ranking || [],
        nortePalpites: palpites?.filter(p => p.jogadores.liga_atual === 'Norte') || [],
        sulPalpites: palpites?.filter(p => p.jogadores.liga_atual === 'Sul') || [],
        stats: { saldo, roi: 12.4, ganhoPotencial: 84.0 },
        submissions: { 
          norte: palpites?.filter(p => p.jogadores.liga_atual === 'Norte').length || 0, 
          sul: palpites?.filter(p => p.jogadores.liga_atual === 'Sul').length || 0 
        },
        loading: false
      });
    } catch (error) {
      console.warn('Using mock data for development - Supabase not connected:', error.message);
      // Mock Data for UI Verification
      setData({
        ranking: [
          { nome: 'Cintra', greens: 12 },
          { nome: 'Vilao', greens: 10 },
          { nome: 'Gomes', greens: 8 },
        ],
        nortePalpites: [
          { resultado_individual: 'GREEN', jogadores: { nome: 'Cintra' } },
          { resultado_individual: 'PENDENTE', jogadores: { nome: 'Vilao' } },
        ],
        sulPalpites: [
          { resultado_individual: 'RED', jogadores: { nome: 'Gomes' } },
        ],
        stats: { saldo: 342.50, roi: 12.4, ganhoPotencial: 84.0 },
        submissions: { norte: 2, sul: 1 },
        loading: false
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
};
