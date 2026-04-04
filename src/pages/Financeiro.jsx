import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabaseClient';
import { Wallet, PlusCircle, MinusCircle, History, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Financeiro = () => {
  const { isAdmin } = useAdmin();
  const { stats, loading: dashLoading } = useDashboardData();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ valor: '', tipo: 'ENTRADA', descricao: '' });
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('banca')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!isAdmin || !formData.valor || !formData.descricao) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('banca')
        .insert([{
          valor: Number(formData.valor),
          tipo: formData.tipo,
          descricao: formData.descricao
        }]);

      if (error) throw error;
      
      setFormData({ valor: '', tipo: 'ENTRADA', descricao: '' });
      fetchTransactions();
      // Atualizar dados globais da dashboard
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Erro ao registar transação');
    } finally {
      setSaving(false);
    }
  };

  if (loading || dashLoading) return <div className="text-white text-center mt-20">A carregar finanças...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
          <Wallet className="text-primary" size={32} />
          <span>Gestão <span className="text-primary tracking-widest">Financeira</span></span>
        </h2>
        <p className="text-slate-500 font-medium text-sm mt-2">
          Controla a banca, multas e prémios do grupo.
        </p>
      </div>

      {/* Saldo Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-emerald-900/40 border border-primary/20 rounded-3xl p-8 shadow-2xl">
        <div className="relative z-10">
          <p className="text-primary/60 text-xs font-black uppercase tracking-[0.2em] mb-1">SALDO TOTAL DA BANCA</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-display font-black text-white tabular-nums">{stats.saldo.toFixed(2)}</span>
            <span className="text-2xl font-bold text-primary">€</span>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 text-primary/5 transform -rotate-12">
          <DollarSign size={200} />
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-red-400 text-sm font-medium">Log in como Admin para registar multas ou prémios.</p>
        </div>
      )}

      {/* Registo Form */}
      {isAdmin && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <PlusCircle size={18} className="text-primary" /> Nova Movimentação
          </h3>
          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'ENTRADA' })}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  formData.tipo === 'ENTRADA' ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-800/50 border-white/5 text-slate-500'
                }`}
              >
                <TrendingUp size={16} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'SAIDA' })}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  formData.tipo === 'SAIDA' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800/50 border-white/5 text-slate-500'
                }`}
              >
                <TrendingDown size={16} /> Saída
              </button>
            </div>
            
            <input
              type="number"
              step="0.01"
              placeholder="Valor (€)"
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />
            
            <input
              type="text"
              placeholder="Descrição (ex: Multa Gomes Semana 14)"
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
            
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-primary text-[#0f172a] py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition shadow-[0_4px_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
            >
              {saving ? 'A REGISTAR...' : 'CONFIRMAR MOVIMENTAÇÃO'}
            </button>
          </form>
        </div>
      )}

      {/* Histórico */}
      <div className="space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2 px-2">
          <History size={18} className="text-slate-400" /> Histórico Recente
        </h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map((t) => (
            <div key={t.id} className="bg-slate-800/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center group hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${t.tipo === 'ENTRADA' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                  {t.tipo === 'ENTRADA' ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{t.descricao}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                    {new Date(t.created_at).toLocaleDateString('pt-PT')} às {new Date(t.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-display font-black ${t.tipo === 'ENTRADA' ? 'text-primary' : 'text-red-500'}`}>
                {t.tipo === 'ENTRADA' ? '+' : '-'}{Number(t.valor).toFixed(2)}€
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center glass-card border-dashed">
              <p className="text-slate-500 text-xs font-medium italic">Nenhuma movimentação registada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financeiro;
