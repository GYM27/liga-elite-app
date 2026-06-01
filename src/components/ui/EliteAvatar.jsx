import React from 'react';

/**
 * EliteAvatar - Componente de imagem de perfil com fallback para iniciais.
 */
const EliteAvatar = ({ src, name, size = 'md', className = '', inDebt = false }) => {
  const sizeMap = {
    xs: "w-6 h-6 text-[7px]",
    sm: "w-8 h-8 text-[8px]",
    md: "w-12 h-12 text-[10px]",
    lg: "w-20 h-20 text-xs",
    xl: "w-32 h-32 text-xl"
  };

  const statusStyles = inDebt 
    ? "border-rose-500 shadow-lg shadow-rose-500/20 grayscale-[0.4]" 
    : "border-white/10 group-hover:border-primary/50";

  return (
    <div className={`rounded-full overflow-hidden border-2 transition-all duration-500 flex-shrink-0 ${sizeMap[size]} ${statusStyles} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = ''; e.target.onerror = null; }}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-black uppercase ${inDebt ? 'bg-rose-900/50 text-rose-200' : 'bg-slate-800 text-slate-500'}`}>
          {name ? name.substring(0, 2) : '??'}
        </div>
      )}
    </div>
  );
};

export default EliteAvatar;
