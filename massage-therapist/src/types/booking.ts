export type BookingStatus =
  | 'pending'
  | 'searching_therapist'
  | 'waiting_therapist_accept'
  | 'confirmed'
  | 'therapist_on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_therapist'
  | 'cancelled_by_admin'
  | 'rejected'
  | 'expired';

export type BookingUser = {
  id?: number;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export type BookingClient = {
  id?: number;
  userId?: number;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  user?: BookingUser;
};

export type BookingTherapist = {
  id?: number;
  userId?: number;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  user?: BookingUser;
};

export type BookingStatusHistory = {
  id: number;
  bookingId?: number;
  fromStatus?: BookingStatus | null;
  toStatus: BookingStatus;
  note?: string | null;
  reason?: string | null;
  changedByUserId?: number | null;
  changedByUser?: BookingUser | null;
  createdAt: string;
};

export type Booking = {
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
  servicePrice: number;
  platformFee?: number;
  taxAmount?: number;
  totalAmount: number;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  clientNote?: string | null;
  acceptedAt?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  client?: BookingClient | null;
  therapist?: BookingTherapist | null;
  statusHistories?: BookingStatusHistory[];
};

export type BookingListResponse = {
  items: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
