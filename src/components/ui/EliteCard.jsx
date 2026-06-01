import React from 'react';

/**
 * EliteCard - O container padrão da Liga Elite com efeito glassmorphism.
 */
const EliteCard = ({ children, className = '', variant = 'default', padding = 'p-6', onClick }) => {
  const baseStyles = "rounded-[32px] border-2 transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    default: "bg-slate-900 border-white/5",
    primary: "bg-slate-900 border-primary/20 shadow-lg shadow-primary/5",
    danger: "bg-rose-500/5 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    success: "bg-emerald-500/5 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    glass: "bg-white/5 backdrop-blur-md border-white/10",
    dark: "bg-slate-950 border-white/5"
  };

  const interactiveStyles = onClick ? "active:scale-[0.98] cursor-pointer hover:bg-slate-800/80" : "";

  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${padding} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};

export default EliteCard;
