import type { BookingStatus } from '@/types';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  waiting_therapist_accept: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  therapist_on_the_way: 'Đang di chuyển',
  arrived: 'Đã đến nơi',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
};

export const getNextTherapistAction = (status: BookingStatus) => {
  switch (status) {
    case 'waiting_therapist_accept':
      return { status: 'confirmed' as const, label: 'Nhận booking' };
    case 'confirmed':
      return { status: 'therapist_on_the_way' as const, label: 'Bắt đầu di chuyển' };
    case 'therapist_on_the_way':
      return { status: 'arrived' as const, label: 'Đã đến nơi' };
    case 'arrived':
      return { status: 'in_progress' as const, label: 'Bắt đầu massage' };
    case 'in_progress':
      return { status: 'completed' as const, label: 'Hoàn thành dịch vụ' };
    default:
      return null;
  }
};

export const canRejectBooking = (status: BookingStatus) => status === 'waiting_therapist_accept';
