import { APP_COLOR } from '@/utils/constant';

export const normalizeBookingStatus = (status?: string | null) =>
  (status ?? '').trim().toLowerCase();

export const getBookingStatusMeta = (status?: string | null) => {
  switch (normalizeBookingStatus(status)) {
    case 'pending':
      return {
        label: 'Chờ xử lý',
        backgroundColor: '#F1F5F9',
        textColor: '#475569',
      };

    case 'searching_therapist':
      return {
        label: 'Đang tìm KTV',
        backgroundColor: '#E0F2FE',
        textColor: '#0369A1',
      };

    case 'waiting_therapist_accept':
      return {
        label: 'Chờ KTV xác nhận',
        backgroundColor: '#FEF3C7',
        textColor: '#92400E',
      };

    case 'confirmed':
    case 'accepted':
      return {
        label: 'Đã xác nhận',
        backgroundColor: '#DBEAFE',
        textColor: '#1D4ED8',
      };

    case 'therapist_on_the_way':
      return {
        label: 'KTV đang đến',
        backgroundColor: '#EDE9FE',
        textColor: '#6D28D9',
      };

    case 'arrived':
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

    case 'cancelled_by_client':
      return {
        label: 'Bạn đã hủy',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
      };

    case 'cancelled_by_therapist':
      return {
        label: 'KTV đã hủy',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
      };

    case 'cancelled_by_admin':
      return {
        label: 'Hệ thống đã hủy',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
      };

    case 'cancelled':
    case 'canceled':
      return {
        label: 'Đã hủy',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
      };

    case 'rejected':
      return {
        label: 'KTV từ chối',
        backgroundColor: '#FFF1F2',
        textColor: '#BE123C',
      };

    case 'expired':
      return {
        label: 'Hết hạn',
        backgroundColor: '#F1F5F9',
        textColor: '#64748B',
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

  return [
    'pending',
    'searching_therapist',
    'waiting_therapist_accept',
    'confirmed',
    'accepted',
  ].includes(normalized);
};

export const canClientRateBooking = (status?: string | null) =>
  normalizeBookingStatus(status) === 'completed';
