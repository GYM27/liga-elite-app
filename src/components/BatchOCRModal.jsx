import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { X, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const BatchOCRModal = ({ isOpen, onClose, leagueName, players, currentWeek, onComplete, existingPalpites = {} }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [detectedBets, setDetectedBets] = useState([]);
  const [globalData, setGlobalData] = useState({ odd: 0, stake: 5, prize: 0 });
  const [mappings, setMappings] = useState({});
  const [matchStatus, setMatchStatus] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      processImage(selectedFile);
    }
  };

  const processImage = async (imageFile) => {
    setProcessing(true);
    setError(null);
    try {
      const worker = await createWorker('por'); // Idioma português
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();

      parseText(text);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar imagem. Tenta um print mais nítido.');
    } finally {
      setProcessing(false);
    }
  };

  const parseText = (text) => {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    const bets = [];
    let detectedGlobalOdd = 0;
    let detectedPrize = 0;
      // Função auxiliar para procurar um número decimal (Odd) perto da linha das equipas
    const findOddNear = (index) => {
      const oddRegex = /(\d+[.,]\d{2})/;
      // Procurar apenas num intervalo curto para evitar apanhar a odd global do topo
      for (let j = -2; j <= 1; j++) {
        const checkIdx = index + j;
        if (checkIdx >= 0 && checkIdx < lines.length) {
          const line = lines[checkIdx];
          // Ignorar linhas que pareçam resumos globais
          if (line.toLowerCase().includes('seleç') || line.includes(',')) continue;
          
          const match = line.match(oddRegex);
          if (match) return match[1].replace(',', '.');
        }
      }
      return null;
    };

    const findPrognostic = (index, oddValue) => {
      for (let j = -4; j <= 1; j++) {
        const checkIdx = index + j;
        if (checkIdx >= 0 && checkIdx < lines.length) {
          const line = lines[checkIdx];
          if (
            line.includes(' - ') || 
            line === oddValue || 
            line.match(/^\d+[.,]\d{2}$/) ||
            line.toLowerCase().includes('resultado final')
          ) continue;
          
          if (line.length > 2 && line.length < 30) return line;
        }
      }
      return 'Verificar print';
    };

    // Procurar Odd Global Primeiro para referência
    let summaryLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('seleç')) {
        summaryLineIndex = i;
        const allNumbers = lines[i].match(/(\d+[.,]\d{2})/g) || 
                          (lines[i+1] && lines[i+1].match(/(\d+[.,]\d{2})/g));
        if (allNumbers && allNumbers.length > 0) {
          detectedGlobalOdd = Number(allNumbers[allNumbers.length - 1].replace(',', '.'));
        }
        break;
      }
    }

    const cleanTeamName = (name) => {
      // Remover "Lixo" do OCR:
      // - Números isolados nas pontas (ícones interpretados como 4, 7, etc)
      // - Símbolos estranhos
      return name
        .replace(/^[\d\W]\s+/, '') // Remove número ou símbolo isolado no início (ex: "4 Norwich")
        .replace(/\s+[\d\W]$/, '') // Remove no fim
        .replace(/[^\w\s\-\.áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/g, '') // Remove símbolos estranhos mantendo acentos
        .trim();
    };

    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        
        // Só processar apostas individuais que ocorram DEPOIS do cabeçalho de resumo
        if (summaryLineIndex !== -1 && i <= summaryLineIndex + 1) continue;

        // Detetar Prémio Global (Geralmente no fim do print)
        if (currentLine.toLowerCase().includes('ganhos') || currentLine.toLowerCase().includes('potenciais')) {
          const prizeMatch = currentLine.match(/(\d+[.,]\d{2})/);
          if (prizeMatch) detectedPrize = Number(prizeMatch[1].replace(',', '.'));
          continue;
        }

        if (currentLine.includes(' - ') && !currentLine.includes(':')) {
          const teams = currentLine.split(' - ');
          const odd = findOddNear(i);
          const prognostic = findPrognostic(i, odd);

          bets.push({
            equipa_casa: cleanTeamName(teams[0]),
            equipa_fora: cleanTeamName(teams[1]),
            aposta: prognostic,
            odd: odd || '1.00',
            originalText: currentLine
          });
        }
    }

    if (bets.length === 0) {
      setError('Não detetei apostas. Tenta um print que mostre a lista de jogos claramente.');
    } else {
      setDetectedBets(bets);
      setGlobalData({ odd: detectedGlobalOdd, prize: detectedPrize, stake: 5 });
      
      const initialMappings = {};
      const initialStatus = {};
      
      bets.forEach((bet, idx) => {
        const matchingPlayer = Object.values(existingPalpites).find(p => {
          const casaMatch = p.equipa_casa && bet.equipa_casa.toLowerCase().includes(p.equipa_casa.toLowerCase());
          const foraMatch = p.equipa_fora && bet.equipa_fora.toLowerCase().includes(p.equipa_fora.toLowerCase());
          return casaMatch || foraMatch;
        });

        if (matchingPlayer) {
          initialMappings[idx] = matchingPlayer.jogador_id;
          initialStatus[idx] = 'MATCHED';
        } else {
          initialMappings[idx] = '';
          initialStatus[idx] = 'UNMATCHED';
        }
      });

      setMappings(initialMappings);
      setMatchStatus(initialStatus);
    }
  };

  const handleSave = async () => {
    const toUpdate = [];
    for (const [idx, playerId] of Object.entries(mappings)) {
      if (playerId) {
        const bet = detectedBets[idx];
        const existingBet = Object.values(existingPalpites).find(p => p.jogador_id === playerId);
        
        toUpdate.push({
          jogador_id: playerId,
          semana: currentWeek,
          equipa_casa: bet.equipa_casa,
          equipa_fora: bet.equipa_fora,
          jogo: `${bet.equipa_casa} vs ${bet.equipa_fora}`,
          aposta: existingBet?.aposta || '', // Apenas usa o que o membro escreveu. Ignora o texto do print.
          odd: Number(bet.odd),
          resultado_individual: 'PENDENTE'
        });
      }
    }

    if (toUpdate.length === 0) return alert('Associa pelo menos um jogo a um jogador!');

    setProcessing(true);
    try {
      // Obter as ligas atuais dos jogadores para garantir que a gravação é correta
      const { data: rankingData } = await supabase.from('ranking_atual').select('jogador_id, liga_atual');
      const leagueMap = (rankingData || []).reduce((acc, r) => {
        acc[r.jogador_id] = r.liga_atual;
        return acc;
      }, {});

      const toUpdate = [];
      for (const [idx, playerId] of Object.entries(mappings)) {
        if (playerId) {
          const bet = detectedBets[idx];
          const existingBet = Object.values(existingPalpites).find(p => p.jogador_id === playerId);
          
          // Se o membro já escreveu algo, mantemos. Se não, usamos o que o OCR leu!
          const finalAposta = (existingBet?.aposta && existingBet.aposta.trim().length > 0) 
            ? existingBet.aposta 
            : bet.aposta;

          toUpdate.push({
            jogador_id: playerId,
            semana: currentWeek,
            equipa_casa: bet.equipa_casa,
            equipa_fora: bet.equipa_fora,
            jogo: `${bet.equipa_casa} vs ${bet.equipa_fora}`,
            aposta: finalAposta,
            odd: Number(bet.odd),
            resultado_individual: 'PENDENTE',
            data_palpite: new Date().toISOString().split('T')[0],
            liga_no_momento: leagueMap[playerId] || 'Norte'
          });
        }
      }

      if (toUpdate.length === 0) return alert('Associa pelo menos um jogo a um jogador!');

      const { error: upsertError } = await supabase
        .from('palpites')
        .upsert(toUpdate, { onConflict: 'jogador_id,semana' });
      
      if (upsertError) throw upsertError;
      
      alert(`Importação concluída! ${toUpdate.length} cards atualizados.`);
      if (onComplete) await onComplete();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao gravar no banco de dados: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-display font-black text-white uppercase italic">Importar {leagueName}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Lê o print da Betano automaticamente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {!file && !processing && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="p-4 bg-white/5 rounded-2xl text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">Seleciona ou tira um print</p>
                <p className="text-slate-500 text-xs mt-1">O bilhete deve mostrar os jogos e as odds.</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          )}

          {processing && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="text-white font-display font-medium animate-pulse">A ler dados da Elite... Aguarda.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-red-400 text-xs font-medium">{error}</p>
            </div>
          )}

          {detectedBets.length > 0 && !processing && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Resumo Global Detetado */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Resumo do Print</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <span className="text-xs text-slate-400 font-bold">Odd Global: </span>
                      <span className="text-sm font-black text-white">{globalData.odd || '---'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold">Prémio: </span>
                      <span className="text-sm font-black text-white">{globalData.prize || '---'}€</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aposta Base</p>
                  <p className="text-sm font-black text-white">5.00€</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jogos Detetados ({detectedBets.length})</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Confirmado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Pendente</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {detectedBets.map((bet, idx) => {
                  const isMatched = matchStatus[idx] === 'MATCHED';
                  const mappedPlayerId = mappings[idx];
                  const existingBet = mappedPlayerId ? existingPalpites[mappedPlayerId] : null;

                  return (
                    <div 
                      key={idx} 
                      className={`relative border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                        isMatched ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'
                      }`}
                    >
                      {isMatched && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-900 rounded-full p-1 shadow-lg ring-4 ring-slate-900">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase italic">
                          {bet.equipa_casa} <span className="text-slate-500 not-italic">vs</span> {bet.equipa_fora}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg border border-primary/20 shrink-0">ODD: {bet.odd}</span>
                          {existingBet ? (
                            <span className="text-[9px] font-black text-slate-400 px-2 py-0.5 bg-white/5 rounded-lg border border-white/10 italic truncate max-w-[150px]">
                              {existingBet.aposta || 'Sem texto de palpite'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-red-400/50 px-2 py-0.5 bg-red-500/5 rounded-lg border border-red-500/20 italic">
                              Sem palpite registado
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-48">
                        <select 
                          value={mappings[idx]}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setMappings(prev => ({ ...prev, [idx]: newId }));
                            // Atualizar status se mudar manualmente
                            setMatchStatus(prev => ({ 
                              ...prev, 
                              [idx]: newId ? 'MATCHED' : 'UNMATCHED' 
                            }));
                          }}
                          className={`w-full border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors ${
                            isMatched ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-white/10 focus:border-primary/50'
                          }`}
                        >
                          <option value="">Escolher Jogador...</option>
                          {players.map(p => (
                            <option key={p.jogador_id} value={p.jogador_id}>{p.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {detectedBets.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-slate-800/50 flex gap-3">
            <button 
              onClick={() => { setFile(null); setDetectedBets([]); }} 
              className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold text-xs hover:bg-white/10 transition"
            >
              Recomeçar
            </button>
            <button 
              onClick={handleSave}
              disabled={processing}
              className="flex-1 py-3 rounded-xl bg-primary text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
            >
              <Check size={16} /> Gravar Tudo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchOCRModal;
