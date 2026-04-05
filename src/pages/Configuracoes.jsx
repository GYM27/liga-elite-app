import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDashboardData } from '../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Database, RefreshCcw, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

const Configuracoes = () => {
  const navigate = useNavigate();
  const { ranking, stats, currentWeek } = useDashboardData();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const ADMIN_PIN = "2026"; // Podes mudar o PIN aqui

  const handleResetSeason = async () => {
    if (pin !== ADMIN_PIN) {
      setError("PIN INCORRETO 🛑");
      return;
    }

    if (!window.confirm("CUIDADO: Estás prestes a encerrar a Época 2025/2026. Esta ação é IRREVERSÍVEL e vai limpar todos os palpites e a banca atual. Confirmas?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Tirar a "Fotografia" Final (Histórico)
      const vencedorNorte = ranking.filter(p => p.liga_atual === 'Norte')[0]?.nome || 'N/A';
      const vencedorSul = ranking.filter(p => p.liga_atual === 'Sul')[0]?.nome || 'N/A';

      const { error: histError } = await supabase.from('historico_epocas').insert({
        nome_epoca: "Época 2025/2026",
        saldo_final: (stats.saldo || 0),
        vencedor_norte: vencedorNorte,
        vencedor_sul: vencedorSul,
        ranking_json: ranking
      });

      if (histError) throw histError;

      // 2. Limpar Tabelas Ativas
      await supabase.from('palpites').delete().gte('id', 0); // Apagar tudo
      await supabase.from('banca').delete().gte('id', 0); // Apagar tudo

      // 3. Reiniciar Semana
      await supabase.from('config').update({ valor: '1' }).eq('chave', 'semana_atual');

      // 4. Saldo Inicial Novo (Podes ajustar o valor aqui)
      await supabase.from('banca').insert({ tipo: 'ENTRADA', valor: 60, descricao: 'SALDO INICIAL ÉPOCA 26/27 (HERDADO)' });

      setSuccess(true);
      setTimeout(() => window.location.href = '/', 3000); // Voltar ao início

    } catch (err) {
      setError("ERRO NO RESET: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <CheckCircle2 size={120} className="text-emerald-500 animate-bounce" />
        <h2 className="text-3xl font-display font-black text-white italic">ÉPOCA ENCERRADA! 🏁</h2>
        <p className="text-slate-400">O histórico de 2025/2026 foi guardado. <br />A reiniciar para a Semana 1...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10 px-2 max-w-lg mx-auto">
      
      {/* BOTÃO VOLTAR */}
      <div className="pt-4">
         <button 
           onClick={() => navigate(-1)}
           className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
         >
            <ArrowLeft size={20} />
         </button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          <span>Config <span className="text-primary tracking-widest text-xl">Elite</span></span>
        </h2>
      </div>

      {/* PAINEL DE CONTROLO ELITE */}
      <section className="bg-slate-800/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-sm mx-auto text-center">
          
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Valor em Caixa para Arquivo</p>
             <h3 className="text-5xl font-display font-black text-primary tracking-tighter">
                {(stats?.saldo || 0).toFixed(2)}€
             </h3>
          </div>

          <div className="w-16 h-1 border-t border-white/10 mx-auto"></div>

          <div className="space-y-4 pt-2">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase italic">Digite o PIN para Encerrar Época</p>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-3 w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-4 text-3xl font-black tracking-[0.5em] text-center text-primary focus:border-primary focus:outline-none transition-all"
                />
                {error && <p className="mt-2 text-[10px] font-black text-rose-500 uppercase animate-pulse">{error}</p>}
             </div>

             <button 
               onClick={handleResetSeason}
               disabled={loading || pin.length < 4}
               className={`w-full py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all ${
                 loading ? 'bg-slate-700 text-slate-400' : 'bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_30px_#f43f5e55]'
               }`}
             >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                {loading ? 'A ARQUIVAR...' : 'RESET & ARQUIVO 25/26'}
             </button>
          </div>
        </div>

        {/* Fundo Decorativo */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Info Técnica */}
      <div className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl">
         <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-slate-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Informações do Snapshop</h4>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Saldo Final p/ Arquivo</p>
               <p className="font-bold text-white">{(stats?.saldo || 0).toFixed(2)}€</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Membros Ranking</p>
               <p className="font-bold text-white">{ranking?.length || 0} Ativos</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Configuracoes;
