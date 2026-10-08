export enum BookingStatus {
  PENDING = 'pending',
  SEARCHING_THERAPIST = 'searching_therapist',
  WAITING_THERAPIST_ACCEPT = 'waiting_therapist_accept',
  CONFIRMED = 'confirmed',
  THERAPIST_ON_THE_WAY = 'therapist_on_the_way',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_BY_CLIENT = 'cancelled_by_client',
  CANCELLED_BY_THERAPIST = 'cancelled_by_therapist',
  CANCELLED_BY_ADMIN = 'cancelled_by_admin',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface BookingUser {
  id?: number;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface BookingTherapist {
  id?: number;
  userId?: number;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  user?: BookingUser;
  ratingAverage?: number | string | null;
  ratingCount?: number;
}

export interface BookingStatusHistory {
  id: number;
  bookingId?: number;
  fromStatus?: BookingStatus | null;
  toStatus: BookingStatus;
  note?: string | null;
  reason?: string | null;
  changedByUserId?: number | null;
  changedByUser?: BookingUser | null;
  createdAt: string;
}

export interface Booking {
  id: number;
  bookingCode?: string;
  clientId?: number;
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
  updatedAt?: string;
  therapist?: BookingTherapist | null;
  statusHistories?: BookingStatusHistory[];
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

export interface ClientBookingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClientBookingsResponse {
  items: Booking[];
  pagination: ClientBookingPagination;
}

export interface ClientBookingsQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}
