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

const getNaturalEliteWeek = () => {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return weekNo + 26;
};

export const useDashboardData = () => {
  const [data, setData] = useState({
    ranking: [],
    allMonthlyRankings: {},
    currentWeek: getNaturalEliteWeek(),
    naturalWeek: getNaturalEliteWeek(),
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
      const naturalWeek = getNaturalEliteWeek();
      const { data: allConfigs } = await supabase
        .from("config")
        .select("*");
      const configData = allConfigs?.find(c => c.chave === "semana_atual");
      const currentWeekNum = configData ? Number(configData.valor) : naturalWeek;

      // BUSCA O RANKING E OS JOGADORES EM TEMPO REAL PARA GARANTIR SINCRONIZAÇÃO DE LIGAS
      const [{ data: rawRanking }, { data: rawPlayers }] = await Promise.all([
        supabase.from("ranking_atual").select("*"),
        supabase.from("jogadores").select("id, liga_atual, nome, foto_url")
      ]);

      // Mapeamos liga_atual E foto_url reais da tabela jogadores para sobrepor cache da view
      const playerDataMap = {};
      (rawPlayers || []).forEach(p => {
        playerDataMap[p.id] = { liga_atual: p.liga_atual, foto_url: p.foto_url };
      });

      // Ranking ordenado por Greens para suportar subida/descida automática
      const rankingNormalizado = (rawRanking || [])
        .map((p) => ({
          ...p,
          jogador_id: p.jogador_id || p.id,
          liga_atual: playerDataMap[p.jogador_id || p.id]?.liga_atual || p.liga_atual,
          foto_url: playerDataMap[p.jogador_id || p.id]?.foto_url || p.foto_url, // USA TABELA REAL
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

      const { data: allPaidMensalidades } = await supabase
        .from("mensalidades")
        .select("jogador_id, mes, pago")
        .eq("pago", true);
      const fullPaidMap = (allPaidMensalidades || []).reduce((acc, m) => {
        if (!acc[m.jogador_id]) acc[m.jogador_id] = {};
        acc[m.jogador_id][m.mes] = true;
        return acc;
      }, {});

      let allBancaTransactions = [];
      try {
        const { data: bD, error: bE } = await supabase
          .from("banca_transacoes")
          .select("*");
        if (bE) console.warn("Erro na banca:", bE);
        allBancaTransactions = (bD || []).sort((a, b) => {
          const dateA = new Date(a.created_at || a.data || a.id || 0);
          const dateB = new Date(b.created_at || b.data || b.id || 0);
          return dateA - dateB;
        });
      } catch (e) {
        console.warn("Banca Offline");
      }

      // LÓGICA DE DÍVIDA: isPastMonday > 1 significa Terça-feira em diante (Segunda é livre)
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const isPastMonday = currentDayOfWeek > 1;

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

        // 1. Verificar se deve algum mês PASSADO (importante!)
        const mesesPendentesPassados = Object.entries(historyPlayer).filter(([mes, pago]) => {
          return pago === false && mes !== currentMonthText; // Se estiver na DB como falso e não for o mês atual
        });

        if (mesesPendentesPassados.length > 0) {
          emDivida = true;
          motivo = "MÊS ANTERIOR PENDENTE";
        }

        // 2. Multas/Dívidas manuais
        if (pendentes.length > 0) {
          emDivida = true;
          motivo = motivo ? "DÍVIDAS ACUMULADAS" : "MULTA PENDENTE";
        }

        // 3. Falta de palpite (da Terça-feira em diante)
        if (isPastMonday && !submeteu) {
          emDivida = true; // Se não pos o palpite semanal ja passa a vermelho
          motivo = motivo ? "FALTA PALPITE + DÍVIDA" : "FALTA PALPITE DA SEMANA";
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

      const liquidas = allBancaTransactions.filter((t) => t.pago !== false);
      const manualEntradas = liquidas
        .filter((t) => ["ENTRADA", "MENSALIDADE", "PREMIO"].includes(t.tipo))
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const manualSaidas = liquidas
        .filter((t) => ["SAIDA", "MULTA", "LEVANTAMENTO"].includes(t.tipo))
        .reduce((acc, t) => acc + Math.abs(Number(t.valor)), 0);

      const WEEKLY_STAKE = 10.0;
      const allWeeksInHistory = [
        ...new Set(fullHistoryMapped.map((p) => Number(p.semana))),
      ];
      let totalStakes = allWeeksInHistory.length * WEEKLY_STAKE;

      let totalPrizes = 0;
      allWeeksInHistory.forEach((w) => {
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
          totalPrizes +=
            norte.reduce((acc, p) => acc * Number(p.odd || 1), 1) * 5.0;
        }
        if (
          sul.length > 0 &&
          sul.every((p) => p.resultado_individual === "GREEN")
        ) {
          totalPrizes +=
            sul.reduce((acc, p) => acc * Number(p.odd || 1), 1) * 5.0;
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
        equipas: (rawEquipas || []).map((e) => e.nome),
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
        naturalWeek: naturalWeek,
        stats: {
          saldo: baseBalance,
          totalEntradas: manualEntradas + totalPrizes,
          totalSaidas: manualSaidas + totalStakes,
          transacoes: allBancaTransactions,
        },
        fullHistory: fullHistoryMapped,
        availableWeeks: [...new Set([...allWeeksInHistory, currentWeekNum, naturalWeek])].sort((a, b) => b - a),
        emittedMap: (allConfigs || []).filter(c => c.chave.startsWith("bilhete_emitido_")).reduce((acc, c) => {
          acc[c.chave] = c.valor === "true";
          return acc;
        }, {}),
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  const emitBet = async (week, league, amount = 5.0) => {
    try {
      const key = `bilhete_emitido_${league.toLowerCase()}_${week}`;
      
      // 1. Verificar se já existe
      const { data: existing } = await supabase.from("config").select("valor").eq("chave", key).maybeSingle();
      if (existing?.valor === "true") {
        alert("Atenção: Este bilhete já foi emitido e a stake já foi descontada!");
        return;
      }

      // 2. Descontar da CASA
      const { data: bP } = await supabase.from("banca_particoes").select("casa_valor").eq("id", 1).maybeSingle();
      if (bP) {
        const newVal = (Number(bP.casa_valor) || 0) - amount;
        const { error: upError } = await supabase.from("banca_particoes").update({ casa_valor: newVal }).eq("id", 1);
        if (upError) throw upError;
      }

      // 3. Registar Transação
      await supabase.from("banca_transacoes").insert([{
        valor: amount,
        tipo: "SAIDA",
        descricao: `Stake Bilhete S${week} - ${league.toUpperCase()}`,
        created_at: new Date().toISOString()
      }]);

      // 4. Marcar como Emitido
      await supabase.from("config").upsert({ chave: key, valor: "true" }, { onConflict: "chave" });

      await fetchData();
      alert(`Bilhete da Liga ${league} emitido! -5,00€ descontados da CASA. 🚀💰`);
    } catch (e) {
      alert("Erro na emissão: " + e.message);
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

  // --- AVANÇAR SEMANA COM CÁLCULO DE PROMOÇÕES/DESCIDAS ---
  const advanceWeek = async () => {
    try {
      // 1. SNAPSHOT ANTES: guardar qual liga cada jogador está agora
      const { data: freshRank } = await supabase.from("ranking_atual").select("*");
      if (!freshRank) throw new Error("Ranking indisponível.");

      const sorted = [...freshRank].sort((a, b) => Number(b.total_greens) - Number(a.total_greens));

      // Mapa de liga ANTES da reorganização
      const ligaAntes = {};
      sorted.forEach(p => { ligaAntes[p.jogador_id] = p.liga_atual; });

      // 2. Calcular nova liga por posição de greens
      const novosStatus = sorted.map((player, index) => ({
        id: player.jogador_id,
        nome: player.nome,
        foto_url: player.foto_url,
        ligaAnterior: player.liga_atual,
        ligaNova: index < 6 ? "Norte" : "Sul",
      }));

      // 3. Atualizar no Supabase
      const updates = novosStatus.map(p =>
        supabase.from("jogadores").update({ liga_atual: p.ligaNova }).eq("id", p.id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error("Erro ao atualizar posições das ligas.");

      // 4. Calcular quem subiu e quem desceu
      const promovidos = novosStatus.filter(p =>
        p.ligaAnterior?.toLowerCase() === "sul" && p.ligaNova === "Norte"
      );
      const descidos = novosStatus.filter(p =>
        p.ligaAnterior?.toLowerCase() === "norte" && p.ligaNova === "Sul"
      );

      // 5. Avançar número da semana
      const nextWeek = data.currentWeek + 1;
      const { error } = await supabase
        .from("config").update({ valor: nextWeek.toString() }).eq("chave", "semana_atual");
      if (error) throw error;

      // 6. Atualizar estado com promoções/descidas
      setData(prev => ({ ...prev, lastPromotion: { promovidos, descidos, semana: data.currentWeek } }));

      await fetchData();
      return { success: true, promovidos, descidos };
    } catch (err) {
      console.error("Erro ao avançar semana:", err);
      return { success: false };
    }
  };

  const reorganizeLigas = async () => {
    try {
      // Busca ranking fresco diretamente do Supabase
      const { data: freshRank, error: rankErr } = await supabase.from("ranking_atual").select("*");
      if (rankErr) throw rankErr;
      if (!freshRank || freshRank.length === 0) throw new Error("Ranking vazio.");

      // Ordena por greens (Top 6 → Norte, Resto → Sul)
      const sorted = [...freshRank].sort((a, b) => Number(b.total_greens) - Number(a.total_greens));

      // Atualiza liga_atual de cada jogador na tabela real
      const updates = sorted.map((player, index) =>
        supabase
          .from("jogadores")
          .update({ liga_atual: index < 6 ? "Norte" : "Sul" })
          .eq("id", player.jogador_id || player.id)
      );

      const res = await Promise.all(updates);
      const errors = res.filter(r => r.error);
      if (errors.length > 0) throw new Error("Falha em " + errors.length + " updates.");

      await fetchData();
      alert("Ligas reorganizadas! 📊✅");
      return true;
    } catch (err) {
      alert("Erro: " + err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...data, fetchData, updatePalpiteResult, advanceWeek, reorganizeLigas, emitBet };
};
