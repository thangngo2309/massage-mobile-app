export type BookingStatus =
  | 'waiting_therapist_accept'
  | 'accepted'
  | 'therapist_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'canceled'
  | string;

export interface BookingTherapistUser {
  id?: number;
  fullName?: string;
  phone?: string;
  email?: string | null;
}

export interface BookingTherapist {
  id?: number;
  userId?: number;
  user?: BookingTherapistUser;
  ratingAverage?: number | string | null;
  ratingCount?: number;
}

export interface Booking {
  id: number;
  bookingCode?: string;
  clientId: number;
  therapistId: number | null;
  serviceOptionId: number;
  therapistServiceId?: number | null;
  status: BookingStatus;
  scheduledAt: string;
  expectedEndAt?: string | null;
  serviceName: string;
  durationMinutes: number;
  servicePrice: number | string;
  platformFee?: number | string;
  taxAmount?: number | string;
  totalAmount: number | string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  districtCode?: string | null;
  provinceCode?: string | null;
  clientNote?: string | null;
  acceptedAt?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
  therapist?: BookingTherapist | null;
}

export interface CreateClientBookingPayload {
  therapistId: number;
  serviceOptionId: number;
  date: string;
  startTime: string;
  address: string;
  latitude: number;
  longitude: number;
  districtCode?: string;
  provinceCode?: string;
  clientNote?: string;
}
