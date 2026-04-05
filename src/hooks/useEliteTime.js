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

  // 3. Cálculo da Semana Elite (Ajuste +26)
  const getEliteWeek = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return weekNo + 26;
  };

  return {
    timeString,
    dayString,
    weekNumber: getEliteWeek(currentTime),
    fullDate: currentTime,
    fullDateString,
  };
};
