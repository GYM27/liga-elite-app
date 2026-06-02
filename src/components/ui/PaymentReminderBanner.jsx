import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { EliteButton } from '../ui';

/**
 * Banner de lembrete de pagamento de mensalidade.
 * Mostra um aviso chamativo quando há jogadores com a mensalidade em falta.
 * Opcionalmente pode ser fechado, lembrando a escolha no localStorage para não
 * incomodar novamente durante a sessão.
 */
const PaymentReminderBanner = ({ players, onOpenAudit }) => {
  const [visible, setVisible] = useState(true);

  // Persistir ocultação apenas na sessão atual
  useEffect(() => {
    const hidden = sessionStorage.getItem('paymentReminderHidden');
    if (hidden) setVisible(false);
  }, []);

  if (!visible || !players?.length) return null;

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('paymentReminderHidden', '1');
  };

  return (
    <div className="fixed inset-x-0 top-16 z-40 flex items-center justify-between p-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xl animate-pulse">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} className="flex-shrink-0" />
        <p className="font-black uppercase tracking-widest text-sm">
          {players.length} jogador{players.length > 1 ? 'es' : ''} com mensalidade pendente! Clique para regularizar.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <EliteButton variant="danger" onClick={() => onOpenAudit(players)} size="sm">
          Ver pendências
        </EliteButton>
        <button onClick={handleClose} className="text-white hover:text-slate-200 transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default PaymentReminderBanner;
