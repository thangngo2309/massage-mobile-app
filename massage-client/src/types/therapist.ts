export type TherapistSortBy = 'rating' | 'price' | 'distance';

export interface TherapistSummary {
  id?: number;
  therapistId: number;
  userId?: number;
  fullName?: string;
  name?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  verificationStatus?: string;
  isAcceptingBookings?: boolean;
  ratingAverage?: number | string | null;
  ratingCount?: number;
  completedBookings?: number;
  serviceName?: string;
  optionLabel?: string;
  durationMinutes?: number;
  price?: number | string | null;
  distanceKm?: number | string | null;
}

export interface TherapistSearchParams {
  serviceOptionId: number;
  date: string;
  startTime: string;
  latitude?: number;
  longitude?: number;
  districtCode?: string;
  provinceCode?: string;
  sortBy?: TherapistSortBy;
  page?: number;
  limit?: number;
}

export interface TherapistSearchResult {
  items: TherapistSummary[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface TherapistAvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string | null;
}

export interface TherapistAvailabilitySlotsResult {
  therapistId: number;
  serviceId: number;
  serviceOptionId: number;
  date: string;
  durationMinutes: number;
  slotInterval: number;
  available: boolean;
  reason?: string | null;
  slots: TherapistAvailabilitySlot[];
}

export interface TherapistAvailabilityCheckResult {
  therapistId: number;
  serviceId: number;
  serviceOptionId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  available: boolean;
  reason?: string | null;
}
