import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MONTH_ORDER = [
  "Junho 2025",
  "Julho 2025",
  "Agosto 2025",
  "Setembro 2025",
  "Outubro 2025",
  "Novembro 2025",
  "Dezembro 2025",
  "Janeiro 2026",
  "Fevereiro 2026",
  "Março 2026",
  "Abril 2026",
];

const getMonthFromDate = (dateStr) => {
  if (!dateStr) return "Mês Desconhecido";
  const date = new Date(dateStr);
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const useDashboardData = () => {
  const [data, setData] = useState({
    ranking: [],
    allMonthlyRankings: {},
    currentWeek: 40,
    stats: { saldo: 0, totalEntradas: 0, totalSaidas: 0, transacoes: [] },
    submissions: { norte: 0, sul: 0 },
    loading: true,
    hallOfFame: { winners: [], losers: [] },
    months: [],
    nortePalpites: [],
    sulPalpites: [],
    allPalpites: [],
    idsNorte: [],
    idsSul: [],
    equipas: [],
  });

  const fetchData = async () => {
    try {
      const { data: configData } = await supabase
        .from("config")
        .select("valor")
        .eq("chave", "semana_atual")
        .single();
      const currentWeekNum = configData ? Number(configData.valor) : 40;

      const { data: rawRanking } = await supabase
        .from("ranking_atual")
        .select("*");
      const rankingNormalizado = (rawRanking || [])
        .map((p) => ({
          ...p,
          jogador_id: p.jogador_id || p.id,
          total_greens: p.total_greens || 0,
        }))
        .sort((a, b) => Number(b.total_greens) - Number(a.total_greens));

      const idsNorte = (rankingNormalizado || [])
        .filter((l) => l.liga_atual?.toLowerCase() === "norte")
        .map((l) => l.jogador_id);
      const idsSul = (rankingNormalizado || [])
        .filter((l) => l.liga_atual?.toLowerCase() === "sul")
        .map((l) => l.jogador_id);

      const playerMap = {};
      rankingNormalizado.forEach((p) => {
        playerMap[p.jogador_id] = { nome: p.nome, foto_url: p.foto_url };
      });

      const { data: allHistory } = await supabase.from("palpites").select("*");

      const historyByMonth = {};
      const winCount = {};

      (allHistory || []).forEach((p) => {
        const month = getMonthFromDate(p.data_palpite);
        const playerInfo = playerMap[p.jogador_id] || {
          nome: "Sócio",
          foto_url: null,
        };

        if (!historyByMonth[month]) historyByMonth[month] = {};
        if (!historyByMonth[month][p.jogador_id]) {
          historyByMonth[month][p.jogador_id] = {
            acertos: 0,
            nome: playerInfo.nome,
            foto_url: playerInfo.foto_url,
          };
        }
        if (p.resultado_individual?.toUpperCase() === "GREEN")
          historyByMonth[month][p.jogador_id].acertos++;
        if (!winCount[p.jogador_id])
          winCount[p.jogador_id] = {
            wins: 0,
            loses: 0,
            nome: playerInfo.nome,
            foto_url: playerInfo.foto_url,
            jogador_id: p.jogador_id,
          };
      });

      const currentMonthText = getMonthFromDate(new Date().toISOString());

      const allRankingsFormatted = {};
      Object.keys(historyByMonth).forEach((m) => {
        allRankingsFormatted[m] = Object.entries(historyByMonth[m])
          .map(([jid, d]) => ({
            ...d,
            jogador_id: jid,
            acertos_mes: d.acertos,
          }))
          .sort((a, b) => b.acertos_mes - a.acertos_mes);
      });

      Object.keys(allRankingsFormatted).forEach((m) => {
        if (m === currentMonthText) return;
        const players = allRankingsFormatted[m];
        if (players && players.length > 1) {
          const max = players[0].acertos_mes;
          const min = players[players.length - 1].acertos_mes;
          if (max !== min) {
            players.forEach((p) => {
              if (p.acertos_mes === max && max > 0)
                winCount[p.jogador_id].wins++;
              if (p.acertos_mes === min) winCount[p.jogador_id].loses++;
            });
          }
        }
      });

      const sortedMonths = MONTH_ORDER.filter((m) => allRankingsFormatted[m]);

      const fullHistoryMapped = (allHistory || []).map((p) => ({
        ...p,
        jogadores: playerMap[p.jogador_id] || { nome: "Sócio", foto_url: null },
      }));

      const currentWeekPalpites = fullHistoryMapped.filter(
        (p) => Number(p.semana) === currentWeekNum,
      );

      // --- OBTER HISTÓRICO TOTAL DE MENSALIDADES ---
      const { data: allPaidMensalidades } = await supabase
        .from("mensalidades")
        .select("jogador_id, mes, pago")
        .eq("pago", true);
      const fullPaidMap = (allPaidMensalidades || []).reduce((acc, m) => {
        if (!acc[m.jogador_id]) acc[m.jogador_id] = {};
        acc[m.jogador_id][m.mes] = true;
        return acc;
      }, {});

      // --- OBTER TRANSAÇÕES DA BANCA (ORDENAÇÃO SEGURA EM MEMÓRIA) ---
      let allBancaTransactions = [];
      try {
        const { data: bD, error: bE } = await supabase
          .from("banca_transacoes")
          .select("*");

        if (bE) console.warn("Erro na banca:", bE);

        // Ordenação robusta em memória (fallbacks para vários nomes de colunas de data)
        allBancaTransactions = (bD || []).sort((a, b) => {
          const dateA = new Date(a.created_at || a.data || a.id || 0);
          const dateB = new Date(b.created_at || b.data || b.id || 0);
          return dateA - dateB;
        });
      } catch (e) {
        console.warn("Banca Offline");
      }

      // LÓGICA DE DÍVIDA DE ELITE
      const today = new Date();
      const currentDay = today.getDate();
      const currentDayOfWeek = today.getDay();
      const isPast8th = currentDay > 8;
      const isPastMonday = currentDayOfWeek === 0 || currentDayOfWeek > 1;

      const rankingComDividas = rankingNormalizado.map((r) => {
        const historyPlayer = fullPaidMap[r.jogador_id] || {};
        const pagoMesAtual = !!historyPlayer[currentMonthText];
        const submeteu = currentWeekPalpites.some(
          (p) => p.jogador_id === r.jogador_id,
        );
        const pendentes = allBancaTransactions.filter(
          (t) => t.jogador_id === r.jogador_id && t.pago === false,
        );

        let emDivida = false;
        let motivo = "";

        if (!pagoMesAtual) {
          emDivida = true;
          motivo = "";
        }
        if (isPastMonday && !submeteu) {
          emDivida = emDivida ? "DUPLA DÍVIDA" : true;
          motivo = motivo ? "MENSALIDADE + PALPITE" : "FALTA PALPITE DA SEMANA";
        }
        if (pendentes.length > 0) {
          emDivida = true;
          motivo = motivo ? "DÍVIDAS ACUMULADAS" : "MULTA PENDENTE";
        }

        return {
          ...r,
          mensalidade_paga: pagoMesAtual,
          submeteu_palpites: submeteu,
          em_divida: emDivida,
          motivo_divida: motivo,
          historico_mensalidades: historyPlayer,
          dividas_pendentes: pendentes,
        };
      });

      // FINANÇAS REAIS
      const liquidas = allBancaTransactions.filter((t) => t.pago !== false);
      const manualEntradas = liquidas
        .filter(
          (t) =>
            t.tipo === "ENTRADA" ||
            t.tipo === "MENSALIDADE" ||
            t.tipo === "PREMIO",
        )
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const manualSaidas = liquidas
        .filter(
          (t) =>
            t.tipo === "SAIDA" ||
            t.tipo === "MULTA" ||
            t.tipo === "LEVANTAMENTO",
        )
        .reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);

      const MONTHLY_REVENUE = 60.0; // TOTAL DO GRUPO (12 SÓCIOS X 5.00€)
      const WEEKLY_STAKE = 10.0;
      const allWeeks = [
        ...new Set(fullHistoryMapped.map((p) => Number(p.semana))),
      ];
      const allMonthsInHistory = [
        ...new Set(
          fullHistoryMapped.map((p) => getMonthFromDate(p.data_palpite)),
        ),
      ];

      let totalStakes = allWeeks.length * WEEKLY_STAKE;
      let totalMensalidades = allMonthsInHistory.length * MONTHLY_REVENUE;

      let totalPrizes = 0;
      allWeeks.forEach((w) => {
        const weekP = fullHistoryMapped.filter((p) => Number(p.semana) === w);
        const norte = weekP.filter(
          (p) => p.liga_no_momento?.toLowerCase() === "norte",
        );
        const sul = weekP.filter(
          (p) => p.liga_no_momento?.toLowerCase() === "sul",
        );

        if (
          norte.length > 0 &&
          norte.every((p) => p.resultado_individual === "GREEN")
        ) {
          const oddN = norte.reduce((acc, p) => acc * Number(p.odd || 1), 1);
          totalPrizes += oddN * 5.0;
        }
        if (
          sul.length > 0 &&
          sul.every((p) => p.resultado_individual === "GREEN")
        ) {
          const oddS = sul.reduce((acc, p) => acc * Number(p.odd || 1), 1);
          totalPrizes += oddS * 5.0;
        }
      });

      let baseBalance = 0;
      try {
        const { data: bancaParts } = await supabase
          .from("banca_particoes")
          .select("*");
        baseBalance = (bancaParts || []).reduce(
          (acc, p) =>
            acc + (Number(p.casa_valor || 0) + Number(p.banco_valor || 0)),
          0,
        );
      } catch (e) {
        console.warn("Partições Offline");
      }

      const { data: rawEquipas } = await supabase
        .from("equipas")
        .select("nome")
        .order("nome");
      const equipasSet = (rawEquipas || []).map((e) => e.nome);

      setData({
        ranking: rankingComDividas,
        allMonthlyRankings: allRankingsFormatted,
        allPalpites: currentWeekPalpites,
        nortePalpites: currentWeekPalpites.filter(
          (p) => p.liga_no_momento?.toLowerCase() === "norte",
        ),
        sulPalpites: currentWeekPalpites.filter(
          (p) => p.liga_no_momento?.toLowerCase() === "sul",
        ),
        equipas: equipasSet,
        idsNorte,
        idsSul,
        submissions: {
          norte: currentWeekPalpites.filter(
            (p) => p.liga_no_momento?.toLowerCase() === "norte",
          ).length,
          sul: currentWeekPalpites.filter(
            (p) => p.liga_no_momento?.toLowerCase() === "sul",
          ).length,
        },
        hallOfFame: {
          winners: Object.values(winCount).sort((a, b) => b.wins - a.wins),
          losers: Object.values(winCount).sort((a, b) => b.loses - a.loses),
        },
        months: sortedMonths,
        currentMonth: currentMonthText,
        currentWeek: currentWeekNum,
        stats: {
          saldo: baseBalance,
          totalEntradas: manualEntradas + totalPrizes, // RECAPE: Mensalidades agora entram via manualEntradas (Liquidadas)
          totalSaidas: manualSaidas + totalStakes,
          transacoes: allBancaTransactions,
        },
        fullHistory: fullHistoryMapped,
        availableWeeks: allWeeks.sort((a, b) => b - a),
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  const updatePalpiteResult = async (id, result) => {
    try {
      const { error } = await supabase
        .from("palpites")
        .update({ resultado_individual: result })
        .eq("id", id);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...data, fetchData, updatePalpiteResult };
};
