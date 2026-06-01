import React from 'react';

/**
 * EliteButton - Botão padronizado com feedback tátil e variantes de cor.
 */
const EliteButton = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  className = "", 
  disabled = false,
  icon: Icon,
  fullWidth = true
}) => {
  const baseStyles = "h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl";
  
  const variants = {
    primary: "bg-primary text-slate-950 hover:shadow-primary/20",
    secondary: "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20",
    success: "bg-emerald-500 text-slate-950 hover:bg-emerald-600",
    ghost: "bg-transparent text-slate-500 hover:text-white",
  };

  const widthStyle = fullWidth ? "w-full" : "px-8";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default EliteButton;
