export type TherapistSortBy = 'rating' | 'price' | 'distance';

export interface TherapistImage {
  id: number;
  imageUrl: string;
  sortOrder?: number;
}

export interface TherapistSummary {
  id?: number;
  therapistId: number;
  userId?: number;
  fullName?: string;
  name?: string;
  stageName?: string | null;
  avatarUrl?: string | null;
  images?: TherapistImage[];
  bio?: string | null;
  gender?: 'unknown' | 'male' | 'female' | 'other' | string;
  hasTattoo?: boolean | null;
  experienceYears?: number | null;
  verificationStatus?: string;
  isAcceptingBookings?: boolean;
  ratingAverage?: number | string | null;
  ratingCount?: number;
  completedBookings?: number;
  onlineStatus?: string | null;
  distanceKm?: number | string | null;

  /**
   * Search API mới trả dữ liệu theo Service
   * thay vì theo một ServiceOption cụ thể.
   */
  serviceId?: number;
  serviceName?: string;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  optionCount?: number;

  /**
   * Các field cũ vẫn giữ optional
   * để tương thích response cũ trong thời gian chuyển đổi.
   */
  serviceOptionId?: number;
  optionLabel?: string;
  durationMinutes?: number;
  price?: number | string | null;
  platformFeeRate?: number | string | null;
  available?: boolean;
}

/**
 * Contract hiện tại của:
 *
 * GET /therapists/search
 *
 * Search chỉ lọc:
 * - serviceId
 * - location
 * - sort
 * - pagination
 *
 * Ngày, giờ và serviceOptionId
 * được dùng ở Availability API sau khi chọn KTV.
 */
export interface TherapistSearchParams {
  serviceId: number;

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
