import { useState, useEffect } from "react";

export const useEliteTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Hora Formatada (15:04)
  const timeString = currentTime.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 2. Dia da Semana (Domingo, Segunda...)
  const dayString = currentTime
    .toLocaleDateString("pt-PT", {
      weekday: "long",
    })
    .split("-")[0];

  // NOVA: Data completa (ex: 05 de abril 2026)
  const fullDateString = currentTime.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // 3. Cálculo da Semana Elite (Início a 8 de Junho de 2026)
  const getEliteWeek = (d) => {
    // 8 de Junho de 2026 (o mês em JS começa no 0, logo Junho é 5)
    const seasonStartDate = new Date(2026, 5, 8); 
    
    // Normalizar as datas (remover as horas)
    const current = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const start = new Date(seasonStartDate.getFullYear(), seasonStartDate.getMonth(), seasonStartDate.getDate());
    
    // Ajustar as datas para a segunda-feira correspondente à sua semana
    const currentDay = current.getDay() || 7;
    current.setDate(current.getDate() - currentDay + 1);
    
    const startDay = start.getDay() || 7;
    start.setDate(start.getDate() - startDay + 1);
    
    // Calcular a diferença em semanas
    const diffTime = current.getTime() - start.getTime();
    const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks + 1;
  };

  return {
    timeString,
    dayString,
    weekNumber: getEliteWeek(currentTime),
    fullDate: currentTime,
    fullDateString,
  };
};
