export const formatNumberInput = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  if (!cleanValue) return '';
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseFormattedNumber = (formattedValue: string): string => {
  return formattedValue.replace(/\./g, '');
};

export const formatToNumber = (formattedValue: string): number => {
  const cleanValue = parseFormattedNumber(formattedValue);
  if (!cleanValue) return 0;
  const value = Number(cleanValue);
  return Number.isFinite(value) ? value : 0;
};

export const formatNumberDisplay = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numberValue)) return '';
  return new Intl.NumberFormat('vi-VN').format(numberValue);
};

export const formatNumber = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '0';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numberValue)) return '0';
  return new Intl.NumberFormat('vi-VN').format(numberValue);
};
