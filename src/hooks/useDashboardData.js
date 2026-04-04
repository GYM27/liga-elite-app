import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const MONTH_ORDER = [
  'Junho 2025', 'Julho 2025', 'Agosto 2025', 'Setembro 2025', 'Outubro 2025', 
  'Novembro 2025', 'Dezembro 2025', 'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026'
];

const getMonthFromDate = (dateStr) => {
  if (!dateStr) return 'Mês Desconhecido';
  const date = new Date(dateStr);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const useDashboardData = () => {
  const [data, setData] = useState({
    ranking: [], allMonthlyRankings: {}, currentWeek: 40, stats: { saldo: 0 },
    submissions: { norte: 0, sul: 0 }, loading: true, hallOfFame: { winners: [], losers: [] },
    months: [], nortePalpites: [], sulPalpites: [], allPalpites: [], idsNorte: [], idsSul: [], equipas: []
  });

  const fetchData = async () => {
    try {
      const { data: configData } = await supabase.from('config').select('valor').eq('chave', 'semana_atual').single();
      const currentWeek = configData ? Number(configData.valor) : 40;

      const { data: rawRanking } = await supabase.from('ranking_atual').select('*');
      const rankingNormalizado = (rawRanking || []).map(p => ({
         ...p, jogador_id: p.jogador_id || p.id, total_greens: p.total_greens || 0
      })).sort((a, b) => Number(b.total_greens) - Number(a.total_greens));

      const idsNorte = (rankingNormalizado || []).filter(l => l.liga_atual?.toLowerCase() === 'norte').map(l => l.jogador_id);
      const idsSul = (rankingNormalizado || []).filter(l => l.liga_atual?.toLowerCase() === 'sul').map(l => l.jogador_id);

      // 1. Criar Mapa de Identidades de Elite (Para evitar nomes fantasma)
      const playerMap = {};
      rankingNormalizado.forEach(p => {
        playerMap[p.jogador_id] = { nome: p.nome, foto_url: p.foto_url };
      });

      const { data: allHistory } = await supabase.from('palpites').select('*');
      
      const historyByMonth = {}; 
      const winCount = {}; 

      (allHistory || []).forEach(p => {
        const month = getMonthFromDate(p.data_palpite);
        const playerInfo = playerMap[p.jogador_id] || { nome: 'Sócio', foto_url: null };
        
        if (!historyByMonth[month]) historyByMonth[month] = {};
        if (!historyByMonth[month][p.jogador_id]) {
          historyByMonth[month][p.jogador_id] = { acertos: 0, nome: playerInfo.nome, foto_url: playerInfo.foto_url };
        }
        if (p.resultado_individual?.toUpperCase() === 'GREEN') historyByMonth[month][p.jogador_id].acertos++;
        if (!winCount[p.jogador_id]) winCount[p.jogador_id] = { wins: 0, loses: 0, nome: playerInfo.nome, foto_url: playerInfo.foto_url, jogador_id: p.jogador_id };
      });

      const currentMonthText = getMonthFromDate(new Date().toISOString());

      const allRankingsFormatted = {};
      Object.keys(historyByMonth).forEach(m => {
        allRankingsFormatted[m] = Object.entries(historyByMonth[m])
          .map(([jid, d]) => ({ ...d, jogador_id: jid, acertos_mes: d.acertos }))
          .sort((a, b) => b.acertos_mes - a.acertos_mes);
      });

      // SÓ CONTAR MESES CONCLUÍDOS
      Object.keys(allRankingsFormatted).forEach(m => {
        if (m === currentMonthText) return;
        const players = allRankingsFormatted[m];
        if (players && players.length > 1) { 
          const max = players[0].acertos_mes;
          const min = players[players.length - 1].acertos_mes;
          if (max !== min) {
            players.forEach(p => {
              if (p.acertos_mes === max && max > 0) winCount[p.jogador_id].wins++;
              if (p.acertos_mes === min) winCount[p.jogador_id].loses++;
            });
          }
        }
      });

      const sortedMonths = MONTH_ORDER.filter(m => allRankingsFormatted[m]);
      
      // 2. Mapear Nomes para o Dashboard de Forma Robusta
      const currentWeekPalpites = (allHistory || []).filter(p => Number(p.semana) === currentWeek).map(p => ({
         ...p,
         jogadores: playerMap[p.jogador_id] || { nome: 'Sócio Desconhecido', foto_url: null }
      }));

      // Obter Pagamentos Mensais (Mensalidades)
      const { data: rawMensalidades } = await supabase.from('mensalidades').select('jogador_id, pago').eq('mes', currentMonthText);
      const paidMap = (rawMensalidades || []).reduce((acc, m) => {
        acc[m.jogador_id] = m.pago;
        return acc;
      }, {});

      // Obter Saldo Real das Partições da Banca Master
      const { data: bancaParts, error: bError } = await supabase.from('banca_particoes').select('*');
      const saldoReal = (bancaParts || []).reduce((acc, p) => acc + (Number(p.casa_valor || 0) + Number(p.banco_valor || 0)), 0);

      // Obter Lista de Equipas para Autocomplete
      const { data: rawEquipas } = await supabase.from('equipas').select('nome').order('nome');
      const equipasSet = (rawEquipas || []).map(e => e.nome);

      setData({
        ranking: rankingNormalizado.map(r => ({ ...r, mensalidade_paga: !!paidMap[r.jogador_id] })),
        allMonthlyRankings: allRankingsFormatted,
        allPalpites: currentWeekPalpites,
        nortePalpites: currentWeekPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'norte'),
        sulPalpites: currentWeekPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'sul'),
        equipas: equipasSet,
        idsNorte,
        idsSul,
        submissions: {
          norte: currentWeekPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'norte').length,
          sul: currentWeekPalpites.filter(p => p.liga_no_momento?.toLowerCase() === 'sul').length
        },
        hallOfFame: {
          winners: Object.values(winCount).sort((a,b) => b.wins - a.wins),
          losers: Object.values(winCount).sort((a,b) => b.loses - a.loses)
        },
        months: sortedMonths, 
        currentMonth: currentMonthText, 
        currentWeek,
        stats: { saldo: saldoReal },
        loading: false
      });
    } catch (err) {
      console.error(err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...data, fetchData };
};
