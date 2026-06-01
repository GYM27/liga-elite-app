import React, { useState, useMemo } from "react";
import { useAdmin } from "../context/AdminContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { supabase } from "../lib/supabaseClient";
import { UserPlus, User, RefreshCw, MessageCircle, Search, Filter, X } from "lucide-react";
import { EliteCard, EliteButton } from "../components/ui";
import MemberCard from "../components/shared/MemberCard";

const Membros = () => {
  const { isAdmin } = useAdmin();
  const {
    ranking, loading, fetchData, currentWeek, reorganizeLigas,
  } = useDashboardData();
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: "", foto_url: "", liga_atual: "Norte" });
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, norte, sul, divida

  const handleEdit = (player) => {
    setEditingId(player.jogador_id);
    setFormData({ nome: player.nome, foto_url: player.foto_url || "", liga_atual: player.liga_atual || "Norte" });
  };

  const handleSave = async (id) => {
    try {
      const updateData = isAdmin ? { nome: formData.nome, foto_url: formData.foto_url, liga_atual: formData.liga_atual } : { foto_url: formData.foto_url };
      const { error } = await supabase.from("jogadores").update(updateData).eq("id", id);
      if (error) throw error;
      setEditingId(null);
      fetchData();
    } catch (err) { alert("Erro: " + err.message); }
  };

  const handleAddPlayer = async () => {
    if (!formData.nome) return;
    try {
      const { error } = await supabase.from("jogadores").insert([{ nome: formData.nome, foto_url: formData.foto_url, liga_atual: formData.liga_atual }]);
      if (error) throw error;
      setIsAdding(false);
      setFormData({ nome: "", foto_url: "", liga_atual: "Norte" });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const generateGlobalReport = () => {
    const pagos = ranking.filter((p) => !p.em_divida).map((p) => ` ${p.nome}`);
    const emFalta = ranking.filter((p) => p.em_divida).map((p) => ` ${p.nome} ${p.motivo_divida}`);
    let report = ` LIGA DE ELITE Semana ${currentWeek}  \n📅 *ESTADO GERAL*\n\n *PAGOS:* \n${pagos.length > 0 ? pagos.join("\n") : "_Nenhum_ "}\n\n *EM DÍVIDA:* \n${emFalta.length > 0 ? emFalta.join("\n") : "_Nenhum_"}\n\n`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
  };

  const filteredRanking = useMemo(() => {
    return (ranking || []).filter(player => {
      const matchesSearch = player.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = 
        activeTab === "all" || 
        (activeTab === "norte" && player.liga_atual === "Norte") ||
        (activeTab === "sul" && player.liga_atual === "Sul") ||
        (activeTab === "divida" && player.em_divida);
      return matchesSearch && matchesTab;
    });
  }, [ranking, searchTerm, activeTab]);

  if (loading) return <div className="text-white text-center mt-20 animate-pulse font-black uppercase text-xs">Recrutando Elite...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8 pb-12 px-1 max-w-lg mx-auto pt-4">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between bg-slate-800/10 border border-white/5 p-5 rounded-[32px]">
        <div className="text-left">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Membros <span className="text-primary italic">Elite</span></h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 italic">Gestão de Unidades</p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={() => window.confirm("Deseja reorganizar as Ligas?") && reorganizeLigas()} 
              className="w-11 h-11 bg-slate-900/50 border border-white/5 text-blue-400 rounded-xl flex items-center justify-center active:rotate-180 transition-all duration-500"
            >
              <RefreshCw size={20} />
            </button>
          )}
          <button 
            onClick={generateGlobalReport} 
            className="w-11 h-11 bg-slate-900/50 border border-white/5 text-emerald-500 rounded-xl flex items-center justify-center active:scale-90 transition-all"
          >
            <MessageCircle size={20} />
          </button>
          <EliteButton 
            variant="primary" 
            className="h-11 px-4 rounded-xl" 
            onClick={() => setIsAdding(true)} 
            icon={UserPlus}
          >
            Alistar
          </EliteButton>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Procurar membro..." 
            className="w-full h-14 bg-slate-900/40 border border-white/5 rounded-2xl pl-12 pr-5 text-sm font-black text-white placeholder:text-slate-600 outline-none focus:border-primary/30 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "Todos", icon: User },
            { id: "norte", label: "Liga Norte", color: "text-blue-400" },
            { id: "sul", label: "Liga Sul", color: "text-orange-400" },
            { id: "divida", label: "Dívidas", color: "text-rose-500" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest italic border transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-primary border-primary text-slate-950' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'}`}
            >
              {tab.icon && <tab.icon size={14} />}
              <span className={activeTab === tab.id ? '' : tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FORMULÁRIO DE ADIÇÃO (OVERLAY) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <EliteCard variant="primary" className="w-full max-w-sm p-8 space-y-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                <UserPlus size={18} className="text-primary" /> Recrutar Novo Membro
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <p className="text-white font-black text-[10px] uppercase italic ml-1">Nome de Guerra</p>
                <input 
                  type="text" 
                  placeholder="Ex: Cristiano Ronaldo" 
                  className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none focus:border-primary/30" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <p className="text-white font-black text-[10px] uppercase italic ml-1">Divisão Inicial</p>
                <select 
                  className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 text-sm font-black text-white outline-none"
                  value={formData.liga_atual}
                  onChange={(e) => setFormData({ ...formData, liga_atual: e.target.value })}
                >
                  <option value="Norte">Norte (Elite)</option>
                  <option value="Sul">Sul (Elite)</option>
                  <option value="">Nenhuma / Observação</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <EliteButton onClick={handleAddPlayer} className="flex-1">Confirmar Recrutamento</EliteButton>
              </div>
            </div>
          </EliteCard>
        </div>
      )}

      {/* LISTA DE MEMBROS FILTRADA */}
      <div className="space-y-4">
        {filteredRanking.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5 opacity-50">
              <User size={32} className="text-slate-700" />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Nenhum membro encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRanking.map((player) => (
              <MemberCard 
                key={player.jogador_id} 
                player={player} 
                isAdmin={isAdmin} 
                onComplete={fetchData} 
                isEditing={editingId === player.jogador_id} 
                onEdit={handleEdit} 
                onCancel={() => setEditingId(null)}
                formData={formData}
                setFormData={setFormData}
                handleSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Membros;
