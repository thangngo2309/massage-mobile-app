export type BookingStatus =
  | 'waiting_therapist_accept'
  | 'confirmed'
  | 'therapist_on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface TherapistBooking {
  id: number;
  status: BookingStatus;
  scheduledAt: string;
  expectedEndAt?: string | null;
  serviceName?: string | null;
  durationMinutes?: number | null;
  servicePrice?: number | string | null;
  platformFee?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  clientNote?: string | null;
  acceptedAt?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  client?: {
    id?: number;
    fullName?: string;
    phone?: string;
    user?: {
      fullName?: string;
      phone?: string;
    } | null;
  } | null;
  serviceOption?: {
    id?: number;
    name?: string;
    durationMinutes?: number;
  } | null;
}
