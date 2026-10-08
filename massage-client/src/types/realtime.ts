import type { UserRole } from '@/constants/common.constant';
import type { BookingStatus } from '@/types/booking';

export interface BookingRealtimePayload {
  id: number;
  clientId: number;
  therapistId: number | null;
  status: BookingStatus;
  scheduledAt?: string | null;
  updatedAt?: string | null;
  sourceRole?: UserRole | 'client' | 'therapist' | 'super_admin' | 'system_admin';
}

export interface ServerToClientEvents {
  'booking.created': (payload: BookingRealtimePayload) => void;
  'booking.updated': (payload: BookingRealtimePayload) => void;
}
