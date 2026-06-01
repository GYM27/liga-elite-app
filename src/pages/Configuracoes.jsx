import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDashboardData } from '../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Database, RefreshCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { EliteCard, EliteButton } from '../components/ui';
import { formatCurrency } from '../utils/formatters';

const Configuracoes = () => {
  const navigate = useNavigate();
  const { ranking, stats } = useDashboardData();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const ADMIN_PIN = "2027"; 

  const handleResetSeason = async () => {
    if (pin !== ADMIN_PIN) {
      setError("PIN INCORRETO 🛑");
      return;
    }

    if (!window.confirm("CONFIRMAÇÃO DE ÉPOCA: Desejas guardar o ranking atual no Histórico e reiniciar a competição desportiva? (Banca e Mensalidades NÃO serão alteradas)")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vencedorNorte = ranking.filter(p => p.liga_atual === 'Norte')[0]?.nome || 'N/A';
      const vencedorSul = ranking.filter(p => p.liga_atual === 'Sul')[0]?.nome || 'N/A';

      const { error: histError } = await supabase.from('historico_epocas').insert({
        nome_epoca: "Época 2026/2027",
        saldo_final: (stats.saldo || 0),
        vencedor_norte: vencedorNorte,
        vencedor_sul: vencedorSul,
        ranking_json: ranking
      });

      if (histError) throw histError;

      const { error: deleteError } = await supabase.from('palpites').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (deleteError) throw deleteError;

      const { error: configError } = await supabase.from('config').update({ valor: '1' }).eq('chave', 'semana_atual');
      if (configError) throw configError;

      setSuccess(true);
      setTimeout(() => navigate('/'), 3000); 

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
        <h2 className="text-3xl font-display font-black text-white italic text-left">ÉPOCA ENCERRADA! 🏁</h2>
        <p className="text-slate-400">O histórico de 2026/2027 foi guardado. <br />A reiniciar para a Semana 1...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10 px-2 max-w-lg mx-auto">
      
      <div className="pt-4 text-left">
         <button 
           onClick={() => navigate(-1)}
           className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
         >
            <ArrowLeft size={20} />
         </button>
      </div>

      <div className="mb-6 flex items-center gap-4 text-left">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          <span>Config <span className="text-primary tracking-widest text-xl">Elite</span></span>
        </h2>
      </div>

      <EliteCard className="text-center" variant="primary">
        <div className="space-y-6 max-w-sm mx-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Valor em Caixa para Arquivo</p>
             <h3 className="text-5xl font-display font-black text-primary tracking-tighter italic">
                {formatCurrency(stats?.saldo || 0)}
             </h3>
          </div>

          <div className="w-16 h-1 border-t border-white/10 mx-auto"></div>

          <div className="space-y-4 pt-2 text-left">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase italic text-center">Digite o PIN para Encerrar Época</p>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-3 w-full bg-slate-950 border-2 border-white/10 rounded-2xl px-4 py-4 text-3xl font-black tracking-[0.5em] text-center text-primary focus:border-primary focus:outline-none transition-all"
                />
                {error && <p className="mt-2 text-[10px] font-black text-rose-500 uppercase animate-pulse text-center">{error}</p>}
             </div>

             <EliteButton 
               variant="danger"
               onClick={handleResetSeason}
               disabled={loading || pin.length < 4}
               icon={RefreshCcw}
               className={loading ? 'animate-pulse' : ''}
             >
                {loading ? 'A ARQUIVAR...' : 'RESET & ARQUIVO 26/27'}
             </EliteButton>
          </div>
        </div>
      </EliteCard>

      <div className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl text-left">
         <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-slate-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Informações do Snapshot</h4>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <EliteCard padding="p-3" variant="dark">
               <p className="text-[8px] font-black text-slate-600 uppercase mb-1 italic">Saldo Final p/ Arquivo</p>
               <p className="font-bold text-white italic">{formatCurrency(stats?.saldo || 0)}</p>
            </EliteCard>
            <EliteCard padding="p-3" variant="dark">
               <p className="text-[8px] font-black text-slate-600 uppercase mb-1 italic">Membros Ranking</p>
               <p className="font-bold text-white italic">{ranking?.length || 0} Ativos</p>
            </EliteCard>
         </div>
      </div>
    </div>
  );
};

export default Configuracoes;
