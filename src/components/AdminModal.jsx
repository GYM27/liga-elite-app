import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { X, Lock, Unlock } from 'lucide-react';

const AdminModal = () => {
  const { isAdmin, login, logout, showAdminModal, setShowAdminModal } = useAdmin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!showAdminModal) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(pin)) {
      setShowAdminModal(false);
      setPin('');
      setError('');
    } else {
      setError('PIN incorreto');
    }
  };

  const handleLogout = () => {
    logout();
    setShowAdminModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={() => setShowAdminModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isAdmin ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
            {isAdmin ? <Unlock size={32} /> : <Lock size={32} />}
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            {isAdmin ? 'Modo Admin Ativo' : 'Acesso Restrito'}
          </h2>
          <p className="text-sm text-slate-400 text-center mt-2">
            {isAdmin 
              ? 'Tem acesso total para registar resultados e pagamentos.' 
              : 'Introduza o PIN de segurança para desbloquear ações de gestão.'}
          </p>
        </div>

        {isAdmin ? (
          <button 
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
          >
            Sair do Modo Admin
          </button>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Introduza o PIN" 
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
                maxLength={4}
              />
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </div>
            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-[#0f172a] font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all"
            >
              Desbloquear
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
