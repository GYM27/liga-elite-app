import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabaseClient';
import { Target, Zap, Calendar, TrendingUp, TrendingDown, PieChart, PlusCircle, MinusCircle, History, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-900 border border-white/10 p-2 rounded-lg shadow-xl">
        <p className="text-[10px] font-black text-slate-500 uppercase">{payload[0].payload.mes}</p>
        <p className="text-sm font-display font-black text-primary">Saldo: {val.toFixed(2)}€</p>
      </div>
    );
  }
  return null;
};

const Estatisticas = () => {
  const { isAdmin } = useAdmin();
  const { currentWeek, stats, loading } = useDashboardData();
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ valor: '', tipo: 'ENTRADA', descricao: '' });
  const [saving, setSaving] = useState(false);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!isAdmin || !formData.valor || !formData.descricao) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('banca')
        .insert([{
          valor: Number(formData.valor.replace(',', '.')),
          tipo: formData.tipo,
          descricao: formData.descricao,
          data: new Date()
        }]);

      if (error) throw error;
      
      setFormData({ valor: '', tipo: 'ENTRADA', descricao: '' });
      setShowAddForm(false);
      // Recarregar para ver os novos dados
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Erro ao registar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20 font-black uppercase text-xs animate-pulse">Analizando Dados Financeiros...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-10">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase italic flex items-center gap-3">
             <PieChart className="text-primary" size={32} />
             <span>Banca <span className="text-primary tracking-widest uppercase text-xl">Elite</span></span>
           </h2>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1">Monitorização Financeira • Semana {currentWeek}</p>
        </div>
        
        {isAdmin && (
           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className={`p-3 rounded-2xl transition-all border flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${
               showAddForm ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' : 'bg-primary/20 border-primary/30 text-primary'
             }`}
           >
              {showAddForm ? 'Cancelar' : 'Novo Movimento'}
              {showAddForm ? <AlertCircle size={14} /> : <PlusCircle size={14} />}
           </button>
        )}
      </div>

      {/* FORMULÁRIO DE NOVO MOVIMENTO (ADMIN ONLY) */}
      {isAdmin && showAddForm && (
        <section className="animate-in zoom-in-95 duration-300 bg-slate-800/40 border border-primary/20 rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
           <div className="relative z-10 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 Nova Movimentação de Caixa
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={() => setFormData({...formData, tipo: 'ENTRADA'})}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      formData.tipo === 'ENTRADA' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_#22c55e33]' : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                 >
                    <PlusCircle size={14} /> Entrada
                 </button>
                 <button 
                    onClick={() => setFormData({...formData, tipo: 'SAIDA'})}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      formData.tipo === 'SAIDA' ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_15px_#f43f5e33]' : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                 >
                    <MinusCircle size={14} /> Saída
                 </button>
              </div>

              <div className="space-y-3">
                 <div className="relative">
                    <input 
                       type="text"
                       placeholder="0,00"
                       value={formData.valor}
                       onChange={(e) => setFormData({...formData, valor: e.target.value})}
                       className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-display font-black text-white focus:outline-none focus:border-primary/50 text-center"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">€</span>
                 </div>
                 
                 <input 
                    type="text"
                    placeholder="Descrição (Ex: Jantar Grupo, Multa X)"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary/50"
                 />

                 <button 
                    onClick={handleAddTransaction}
                    disabled={saving || !formData.valor || !formData.descricao}
                    className="w-full bg-primary text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                 >
                    {saving ? 'A Processar...' : 'Confirmar Transação'}
                 </button>
              </div>
           </div>
           {/* Decorativo */}
           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full"></div>
        </section>
      )}

      {/* EVOLUÇÃO ACUMULADA COM GRÁFICO DE ÁREA */}
      <section className="bg-slate-800/20 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 pb-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic mb-1">Evolução de Performance</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">Baseado em movimentos da época</p>
            </div>
            <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/10`}>
               Monitorização Live ⚡
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] font-black text-slate-500 opacity-60 uppercase mb-1">Saldo Atual em Caixa</p>
            <p className={`text-5xl font-display font-black text-primary tracking-tighter`}>
              {(stats?.saldo || 0).toFixed(2)}€
            </p>
          </div>
        </div>

        {/* GRÁFICO DE ÁREA ACUMULADO */}
        <div className="h-[250px] w-full pt-10 px-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.bancaMensal || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
               <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="mes" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                padding={{ left: 20, right: 20 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="saldo" 
                stroke="#22c55e" 
                strokeWidth={5}
                fillOpacity={1} 
                fill="url(#colorSaldo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-8 pt-6 pb-8 flex justify-between border-t border-white/5 mt-4 bg-slate-900/40">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Total Entradas</span>
              <span className="text-lg font-bold text-emerald-400">{(stats?.totalEntradas || 0).toFixed(2)}€</span>
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Total Saídas</span>
              <span className="text-lg font-bold text-rose-400">{(stats?.totalSaidas || 0).toFixed(2)}€</span>
           </div>
        </div>
      </section>

      {/* MOVIMENTOS DE CAIXA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} />
              Movimentos de Caixa
           </h3>
           <button 
             onClick={() => setShowFullHistory(true)}
             className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 hover:text-white transition-colors"
           >
              Ver Todas {`(${(stats?.transacoes || []).length})`}
           </button>
        </div>

        <div className="space-y-4">
          {(stats?.transacoes || []).length === 0 ? (
            <div className="bg-slate-800/10 border border-dashed border-white/5 p-10 rounded-3xl text-center">
              <p className="text-xs text-slate-600 uppercase font-black tracking-widest uppercase">Sem registos financeiros 🏜️</p>
            </div>
          ) : (
            (stats?.transacoes || []).slice(0, 3).map((t, index) => {
              const isEntrada = String(t.tipo || '').trim().toUpperCase() === 'ENTRADA';
              const val = parseFloat(String(t.valor || '0').replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
              
              return (
                <div key={t.id || index} className="bg-slate-800/20 border border-white/5 p-5 rounded-3xl flex items-center justify-between group transition-all hover:bg-slate-800/40">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${
                        isEntrada ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                         <Zap size={20} fill={isEntrada ? 'currentColor' : 'none'} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight leading-tight uppercase line-clamp-1">{t.descricao || 'Movimento Elite'}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-1 italic">
                           {new Date(t.data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`font-display font-black text-xl ${isEntrada ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {isEntrada ? '+' : '-'}{val.toFixed(2)}€
                      </p>
                   </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL DE HISTÓRICO COMPLETO */}
      {showFullHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm animate-in fade-in" onClick={() => setShowFullHistory(false)}></div>
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg h-[80vh] rounded-[40px] flex flex-col p-8 relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-wider">Histórico Global de Caixa</h3>
                <button onClick={() => setShowFullHistory(false)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all text-slate-400">✕</button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar text-white">
                {(stats?.transacoes || []).map((t, index) => {
                  const isEntrada = String(t.tipo || '').trim().toUpperCase() === 'ENTRADA';
                  const val = parseFloat(String(t.valor || '0').replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
                  return (
                    <div key={t.id || index} className="bg-white/5 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEntrada ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                             <Zap size={18} fill={isEntrada ? 'currentColor' : 'none'} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white uppercase leading-tight line-clamp-1">{t.descricao || 'Sem Descrição'}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase mt-1 italic tracking-widest">{new Date(t.data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                          </div>
                       </div>
                       <p className={`font-display font-black text-lg ${isEntrada ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isEntrada ? '+' : '-'}{val.toFixed(2)}€
                       </p>
                    </div>
                  );
                })}
             </div>
             
             <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Consolidado Elite Bet ©</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estatisticas;
