import React from 'react';

/**
 * EliteBadge - Etiquetas de estado (Pendente, Pago, Green, Red).
 */
const EliteBadge = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const baseStyles = "font-black uppercase tracking-widest italic rounded-full flex items-center justify-center gap-1.5";
  
  const sizes = {
    xs: "px-2 py-0.5 text-[8px]",
    sm: "px-3 py-1 text-[9px]",
    md: "px-4 py-2 text-[10px]",
    lg: "px-6 py-3 text-[12px]"
  };

  const variants = {
    default: "bg-slate-800 text-slate-400 border border-white/5",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    green: "bg-emerald-500 text-slate-950",
    red: "bg-rose-500 text-white"
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default EliteBadge;
