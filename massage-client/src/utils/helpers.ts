export const normalizeVietnamPhone = (phone: string): string => {
  const value = phone.trim().replace(/\s+/g, '');
  if (value.startsWith('+84')) return value;
  if (value.startsWith('84')) return `+${value}`;
  if (value.startsWith('0')) return `+84${value.slice(1)}`;
  return value;
};

export const toLocalPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  if (phone.startsWith('+84')) return `0${phone.slice(3)}`;
  if (phone.startsWith('84')) return `0${phone.slice(2)}`;
  return phone;
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const firstRouteParam = (value?: string | string[]): string => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

export const parseNumberParam = (value?: string | string[]): number | undefined => {
  const raw = firstRouteParam(value);
  if (!raw.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatApiDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatApiTime = (date: Date): string => {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
};

export const parseApiDate = (value?: string | null): Date => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const parseApiTime = (value?: string | null): Date => {
  const now = new Date();
  if (!value) return now;
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return now;
  now.setHours(hour, minute, 0, 0);
  return now;
};

export const formatDuration = (minutes?: number | null): string => {
  const value = Number(minutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 60) return `${value} phút`;

  const hours = Math.floor(value / 60);
  const remain = value % 60;
  return remain ? `${hours} giờ ${remain} phút` : `${hours} giờ`;
};

export const formatDistance = (distance?: number | string | null): string => {
  const value = Number(distance ?? NaN);
  if (!Number.isFinite(value)) return '';
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`;
};
