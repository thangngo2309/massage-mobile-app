import { APP_COLOR } from '@/utils/constant';

export const normalizeBookingStatus = (status?: string | null) =>
  (status ?? '').trim().toLowerCase();

export const getBookingStatusMeta = (status?: string | null) => {
  switch (normalizeBookingStatus(status)) {
    case 'waiting_therapist_accept':
      return {
        label: 'Chờ KTV xác nhận',
        backgroundColor: '#FEF3C7',
        textColor: '#92400E',
      };
    case 'accepted':
      return {
        label: 'Đã xác nhận',
        backgroundColor: '#DBEAFE',
        textColor: '#1D4ED8',
      };
    case 'therapist_arrived':
      return {
        label: 'KTV đã đến',
        backgroundColor: '#E0E7FF',
        textColor: '#4338CA',
      };
    case 'in_progress':
      return {
        label: 'Đang thực hiện',
        backgroundColor: '#CCFBF1',
        textColor: APP_COLOR.PRIMARY_DARK,
      };
    case 'completed':
      return {
        label: 'Hoàn thành',
        backgroundColor: '#DCFCE7',
        textColor: '#166534',
      };
    case 'cancelled':
    case 'canceled':
      return {
        label: 'Đã hủy',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
      };
    default:
      return {
        label: status || 'Không xác định',
        backgroundColor: '#F1F5F9',
        textColor: APP_COLOR.MUTED,
      };
  }
};

export const canClientCancelBooking = (status?: string | null) => {
  const normalized = normalizeBookingStatus(status);
  return normalized === 'waiting_therapist_accept' || normalized === 'accepted';
};

export const canClientRateBooking = (status?: string | null) =>
  normalizeBookingStatus(status) === 'completed';
