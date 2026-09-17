export type TherapistVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface TherapistSelfProfile {
  id: number;
  userId?: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  verificationStatus: TherapistVerificationStatus;
  isAcceptingBookings: boolean;
  averageRating?: number | string | null;
  ratingCount?: number | null;
  completedBookings?: number | null;
  user?: {
    id?: number;
    fullName?: string;
    phone?: string;
    email?: string | null;
  } | null;
}

export interface TherapistServiceItem {
  id: number;
  therapistId?: number;
  serviceOptionId: number;
  price: number | string;
  platformFeeRate?: number | string | null;
  isActive: boolean;
  serviceOption?: {
    id: number;
    name?: string;
    durationMinutes?: number;
    service?: {
      id?: number;
      name?: string;
    } | null;
  } | null;
}

export interface TherapistWorkingHour {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface WorkingHourInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface TherapistScheduleException {
  id: number;
  date: string;
  isDayOff: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface CreateScheduleExceptionPayload {
  date: string;
  isDayOff: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}
