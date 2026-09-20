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
  fullName?: string;
  phone?: string;
  email?: string | null;
};

export type Booking = {
  id: number;
  bookingCode: string;
  clientId: number;
  therapistId: number | null;
  serviceOptionId: number;
  therapistServiceId: number | null;
  status: BookingStatus;
  scheduledAt: string;
  expectedEndAt: string;
  serviceName: string;
  durationMinutes: number;
  servicePrice: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  address: string;
  latitude: number;
  longitude: number;
  clientNote: string | null;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  client?: {
    id: number;
    user?: BookingUser;
  };
  therapist?: {
    id: number;
    user?: BookingUser;
  } | null;
  statusHistories?: Array<{
    id: number;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    changedByUserId: number | null;
    reason: string | null;
    createdAt: string;
    changedByUser?: BookingUser | null;
  }>;
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
