import React, { useMemo, useState, useEffect } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useHistoryData } from '../hooks/useHistoryData';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, TrendingUp, Award, Play, Pause, RotateCcw } from 'lucide-react';
import { EliteCard, EliteButton } from '../components/ui';

// Paleta de cores para as linhas dos jogadores
const COLORS = [
  '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#ea580c', '#6366f1',
  '#14b8a6', '#f472b6', '#fbbf24', '#a855f7', '#2dd4bf', '#fb923c'
];

// Componente para renderizar a cara do jogador no último ponto
const CustomAvatarDot = (props) => {
  const { cx, cy, payload, dataKey, isLastPoint, playersMap } = props;
  
  if (!isLastPoint) return null; // Apenas desenha na última semana
  
  // O dataKey será algo como "123_rank" ou "123_greens". 
  // O ID do jogador é a parte antes do '_'
  const playerId = dataKey.split('_')[0];
  const playerInfo = playersMap[playerId];
  
  if (!playerInfo) return null;

  return (
    <svg x={cx - 12} y={cy - 12} width={24} height={24}>
      <defs>
        <clipPath id={`clip-${playerId}`}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      {/* Círculo de fundo / Borda */}
      <circle cx="12" cy="12" r="12" fill="#0f172a" stroke="#fff" strokeWidth="2" />
      {/* Imagem do Avatar */}
      {playerInfo.foto_url ? (
        <image
          href={playerInfo.foto_url}
          x="0"
          y="0"
          height="24"
          width="24"
          clipPath={`url(#clip-${playerId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text x="12" y="16" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
          {playerInfo.nome.substring(0, 1)}
        </text>
      )}
    </svg>
  );
};

const CustomTooltip = ({ active, payload, label, playersMap, mode }) => {
  if (active && payload && payload.length) {
    // Ordenar do melhor para o pior dependendo do modo
    const sortedPayload = [...payload].sort((a, b) => {
      if (mode === 'rank') return a.value - b.value; // Rank menor é melhor
      return b.value - a.value; // Greens maiores são melhores
    });

    return (
      <div className="bg-[#0f172a]/95 border border-white/10 p-3 rounded-2xl shadow-xl backdrop-blur-md z-50 min-w-[200px]">
        <p className="text-white font-black italic uppercase text-xs mb-2 border-b border-white/5 pb-2 text-center">{label}</p>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {sortedPayload.map((entry, index) => {
            const playerId = entry.dataKey.split('_')[0];
            const pInfo = playersMap[playerId];
            if (!pInfo) return null;
            return (
              <div key={`item-${index}`} className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 text-[10px] font-bold uppercase truncate max-w-[90px]">
                    {pInfo.nome}
                  </span>
                </div>
                <span className="text-white text-[11px] font-black italic">
                  {mode === 'rank' ? `${entry.value}º` : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const EvolucaoGlobal = () => {
  const navigate = useNavigate();
  const { fullHistory, ranking, loading: loadingDash, availableWeeks, currentWeek } = useDashboardData();
  const { history, loading: loadingHistory } = useHistoryData();
  const [mode, setMode] = useState('rank'); // 'rank' | 'greens'

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!ranking) return { data: [], playersMap: {} };

    // Construir o mapa de jogadores com uma cor fixa
    const playersMap = {};
    ranking.forEach((r, idx) => {
      playersMap[r.jogador_id] = {
        ...r,
        color: COLORS[idx % COLORS.length]
      };
    });

    const data = [];
    let cumulativeGreens = {}; // { jogador_id: total_greens }
    ranking.forEach(r => cumulativeGreens[r.jogador_id] = 0);

    // --- FILTRAR SEMANAS ATUAIS FECHADAS ---
    let sortedWeeks = [];
    if (fullHistory && availableWeeks && currentWeek) {
      sortedWeeks = [...availableWeeks]
        .sort((a, b) => a - b)
        .filter(w => w < currentWeek);
    }

    // --- PONTO INICIAL (S0) ---
    // Procura o ranking da época passada
    const previousSeason = history?.[0]?.ranking_json || [];
    
    const s0Obj = {
      name: "S0",
      isLastPoint: sortedWeeks.length === 0
    };

    ranking.forEach(r => {
      const prevIdx = previousSeason.findIndex(p => p.nome === r.nome || p.jogador_id === r.jogador_id);
      // Se estava na época passada, essa é a posição. Se não, fica em último.
      s0Obj[`${r.jogador_id}_rank`] = prevIdx !== -1 ? prevIdx + 1 : ranking.length;
      s0Obj[`${r.jogador_id}_greens`] = 0;
    });

    data.push(s0Obj);

    // --- PROCESSAR SEMANAS FECHADAS ---
    sortedWeeks.forEach((week, index) => {
        const isLastPoint = index === sortedWeeks.length - 1;
        
        // Atualizar greens acumulados com os resultados DESTA semana
        const weekHistory = fullHistory.filter(h => Number(h.semana) === week);
        weekHistory.forEach(h => {
          if (h.resultado_individual === 'GREEN') {
            if (cumulativeGreens[h.jogador_id] !== undefined) {
               cumulativeGreens[h.jogador_id] += 1;
            }
          }
        });

        // Calcular o Ranking exato nesta semana com base nos Greens
        const rankList = Object.entries(cumulativeGreens)
          .map(([jid, greens]) => ({ id: jid, greens }))
          .sort((a, b) => b.greens - a.greens);

        // Objeto da semana para o Recharts
        const weekObj = {
          name: `S${week}`,
          isLastPoint: false // Will be dynamically evaluated
        };

        rankList.forEach((item, rIdx) => {
          // Para Rank, +1 (começa em 1º)
          weekObj[`${item.id}_rank`] = rIdx + 1;
          // Para Greens
          weekObj[`${item.id}_greens`] = item.greens;
        });

        data.push(weekObj);
      });

    return { data, playersMap };
  }, [fullHistory, ranking, availableWeeks, history]);

  const { data, playersMap } = chartData;
  const playerIds = Object.keys(playersMap);

  // --- LÓGICA DE SIMULAÇÃO TEMPORAL (PLAYBACK) ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);

  // Inicializa o index para mostrar tudo assim que os dados carregarem
  useEffect(() => {
    if (data.length > 0 && playbackIndex === -1) {
      setPlaybackIndex(data.length - 1);
    }
  }, [data.length, playbackIndex]);

  // Temporizador de animação
  useEffect(() => {
    let interval;
    if (isPlaying && playbackIndex < data.length - 1) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= data.length - 2) {
            setIsPlaying(false);
            return data.length - 1;
          }
          return prev + 1;
        });
      }, 1200); // 1.2 segundos por transição
    } else if (playbackIndex >= data.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackIndex, data.length]);

  const togglePlayback = () => {
    if (playbackIndex === data.length - 1) {
      // Reiniciar do S0
      setPlaybackIndex(0);
      setIsPlaying(true);
    } else {
      // Pausar / Continuar
      setIsPlaying(!isPlaying);
    }
  };

  // Recorta os dados até ao ponto onde a animação se encontra
  // e recalcula o isLastPoint baseado no array cortado
  const visibleData = useMemo(() => {
    if (playbackIndex < 0) return [];
    return data.slice(0, playbackIndex + 1).map((item, idx, arr) => ({
      ...item,
      isLastPoint: idx === arr.length - 1
    }));
  }, [data, playbackIndex]);

  if (loadingDash || loadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">A calcular histórico...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-6 pb-20 pt-4 px-1 max-w-lg mx-auto text-left">
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
            Evolução <span className="text-primary">Global</span>
          </h2>
        </div>
        
        {/* BOTÃO DE PLAYBACK (Apenas visível se houver mais que 1 ponto no gráfico) */}
        {data.length > 1 && (
          <button 
            onClick={togglePlayback}
            className={`flex items-center gap-2 px-4 h-10 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
              isPlaying 
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_15px_#f43f5e30]' 
                : playbackIndex === data.length - 1 
                  ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-slate-950' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <><Pause size={14} fill="currentColor" /> Pausar</>
            ) : playbackIndex === data.length - 1 ? (
              <><RotateCcw size={14} /> Repetir</>
            ) : (
              <><Play size={14} fill="currentColor" /> Continuar</>
            )}
          </button>
        )}
      </div>

      <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5 mb-4">
        <button 
          onClick={() => setMode('rank')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${mode === 'rank' ? 'bg-primary text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Award size={14} /> Posição
        </button>
        <button 
          onClick={() => setMode('greens')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${mode === 'greens' ? 'bg-primary text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <TrendingUp size={14} /> Total Greens
        </button>
      </div>

      <EliteCard padding="p-4" className="h-[450px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#ffffff40" 
              tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 'bold' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              reversed={mode === 'rank'} 
              domain={mode === 'rank' ? [1, playerIds.length] : ['auto', 'auto']}
              stroke="#ffffff40" 
              tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 'bold' }}
              axisLine={false}
              tickLine={false}
              width={30}
              tickCount={mode === 'rank' ? playerIds.length : 5}
            />
            <Tooltip 
              content={<CustomTooltip playersMap={playersMap} mode={mode} />} 
              cursor={{ stroke: '#ffffff20', strokeWidth: 2, strokeDasharray: '5 5' }}
            />

            {playerIds.map(id => (
              <Line 
                key={id}
                type="monotone" 
                dataKey={mode === 'rank' ? `${id}_rank` : `${id}_greens`}
                stroke={playersMap[id].color} 
                strokeWidth={3}
                dot={(props) => <CustomAvatarDot {...props} playersMap={playersMap} isLastPoint={props.payload.isLastPoint} />}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="linear"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </EliteCard>

      {/* BARRA DE PROGRESSO DO PLAYBACK */}
      {data.length > 1 && (
        <div className="px-4">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(playbackIndex / (data.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-500 text-center font-bold uppercase italic mt-4 px-4">
        Clica em "Repetir" para veres a corrida pela glória semana a semana!
      </p>

    </div>
  );
};

export default EvolucaoGlobal;
