/**
 * Utilitários de Formatação da Liga Elite
 */

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export const formatCompactNumber = (value) => {
  return new Intl.NumberFormat('pt-PT', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('pt-PT');
};

export const getMonthLabel = (dateStr) => {
  const date = new Date(dateStr);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};
