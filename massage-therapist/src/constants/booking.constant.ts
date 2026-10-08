import type { BookingStatus } from '@/types/booking';

export type BookingStatusTone =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Đang xử lý',
  searching_therapist: 'Đang tìm kỹ thuật viên',
  waiting_therapist_accept: 'Chờ kỹ thuật viên xác nhận',
  confirmed: 'Đã xác nhận',
  therapist_on_the_way: 'Kỹ thuật viên đang đến',
  arrived: 'Kỹ thuật viên đã đến',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled_by_client: 'Khách hàng đã hủy',
  cancelled_by_therapist: 'Kỹ thuật viên đã hủy',
  cancelled_by_admin: 'Hệ thống đã hủy',
  rejected: 'Kỹ thuật viên từ chối',
  expired: 'Đã hết hạn',
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, BookingStatusTone> = {
  pending: 'warning',
  searching_therapist: 'info',
  waiting_therapist_accept: 'warning',
  confirmed: 'success',
  therapist_on_the_way: 'info',
  arrived: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled_by_client: 'danger',
  cancelled_by_therapist: 'danger',
  cancelled_by_admin: 'danger',
  rejected: 'danger',
  expired: 'neutral',
};

export const getBookingStatusLabel = (status: BookingStatus | string): string =>
  BOOKING_STATUS_LABEL[status as BookingStatus] ?? status ?? 'Không xác định';

export const getBookingStatusTone = (
  status: BookingStatus | string,
): BookingStatusTone => BOOKING_STATUS_TONE[status as BookingStatus] ?? 'neutral';

export type BookingFilter = 'all' | 'waiting' | 'working' | 'completed';

export const matchBookingFilter = (
  status: BookingStatus,
  filter: BookingFilter,
): boolean => {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'waiting') {
    return status === 'waiting_therapist_accept';
  }

  if (filter === 'working') {
    return (
      status === 'confirmed' ||
      status === 'therapist_on_the_way' ||
      status === 'arrived' ||
      status === 'in_progress'
    );
  }

  if (filter === 'completed') {
    return status === 'completed';
  }

  return true;
};

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  'completed',
  'cancelled_by_client',
  'cancelled_by_therapist',
  'cancelled_by_admin',
  'rejected',
  'expired',
];
