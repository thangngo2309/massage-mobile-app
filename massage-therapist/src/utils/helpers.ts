export const formatCurrency = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  return `${new Intl.NumberFormat('vi-VN').format(
    Number.isFinite(amount) ? amount : 0,
  )} đ`;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const toLocalPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  if (phone.startsWith('+84')) return `0${phone.slice(3)}`;
  return phone;
};

export const normalizeVietnamPhone = (phone: string): string => {
  const value = phone.trim().replace(/\s+/g, '');

  if (value.startsWith('+84')) return value;
  if (value.startsWith('84')) return `+${value}`;
  if (value.startsWith('0')) return `+84${value.slice(1)}`;

  return value;
};
