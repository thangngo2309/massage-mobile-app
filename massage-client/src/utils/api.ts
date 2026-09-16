import api from '@/utils/axios.customize';
import type {
  AuthResponse,
  AuthUser,
  Booking,
  CreateClientBookingPayload,
  CreateRatingPayload,
  LoginPayload,
  Rating,
  RegisterPayload,
  Service,
  TherapistAvailabilityCheckResult,
  TherapistAvailabilitySlotsResult,
  TherapistSearchParams,
  TherapistSearchResult,
  TherapistSummary,
  UpdateRatingPayload,
} from '@/types';

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;

const asItems = <T>(payload: any): T[] => {
  const data = unwrap<any>(payload);
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
};

export const loginAPI = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', payload);
  return unwrap<AuthResponse>(response.data);
};

export const registerAPI = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', payload);
  return unwrap<AuthResponse>(response.data);
};

export const refreshTokenAPI = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/refresh', { refreshToken });
  return unwrap<AuthResponse>(response.data);
};

export const logoutAPI = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', { refreshToken });
};

export const getAccountAPI = async (): Promise<AuthUser> => {
  const response = await api.get('/auth/me');
  return unwrap<AuthUser>(response.data);
};

export const getClientServicesAPI = async (): Promise<Service[]> => {
  const response = await api.get('/services', {
    params: {
      page: 1,
      limit: 100,
      isActive: true,
    },
  });

  return asItems<Service>(response.data);
};

export const getClientServiceAPI = async (id: number): Promise<Service> => {
  const response = await api.get(`/services/${id}`);
  return unwrap<Service>(response.data);
};

export const searchTherapistsAPI = async (
  params: TherapistSearchParams,
): Promise<TherapistSearchResult> => {
  const response = await api.get('/therapists/search', {
    params: {
      ...params,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });

  const data = unwrap<any>(response.data);

  const rawItems: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : [];

  const items = rawItems
    .map(item => ({
      ...item,
      therapistId: Number(item?.therapistId ?? item?.id),
    }))
    .filter(item => Number.isInteger(item.therapistId) && item.therapistId > 0) as TherapistSummary[];

  return {
    items,
    pagination: data?.pagination,
  };
};

export const findMatchingTherapistAPI = async (
  therapistId: number,
  params: TherapistSearchParams,
): Promise<TherapistSummary | null> => {
  const result = await searchTherapistsAPI({
    ...params,
    page: 1,
    limit: Math.max(params.limit ?? 20, 50),
  });

  return (
    result.items.find(item => Number(item.therapistId ?? item.id) === therapistId) ?? null
  );
};

export const getTherapistAvailabilitySlotsAPI = async (
  therapistId: number,
  params: {
    serviceId: number;
    serviceOptionId: number;
    date: string;
    slotInterval?: number;
  },
): Promise<TherapistAvailabilitySlotsResult> => {
  const response = await api.get(`/therapists/${therapistId}/availability/slots`, {
    params,
  });
  return unwrap<TherapistAvailabilitySlotsResult>(response.data);
};

export const checkTherapistAvailabilityAPI = async (
  therapistId: number,
  params: {
    serviceId: number;
    serviceOptionId: number;
    date: string;
    startTime: string;
  },
): Promise<TherapistAvailabilityCheckResult> => {
  const response = await api.get(`/therapists/${therapistId}/availability/check`, {
    params,
  });
  return unwrap<TherapistAvailabilityCheckResult>(response.data);
};

export const createClientBookingAPI = async (
  payload: CreateClientBookingPayload,
): Promise<Booking> => {
  const response = await api.post('/bookings', payload);
  return unwrap<Booking>(response.data);
};

export const getClientBookingsAPI = async (): Promise<Booking[]> => {
  const response = await api.get('/bookings');
  return asItems<Booking>(response.data);
};

export const getClientBookingAPI = async (id: number): Promise<Booking> => {
  const response = await api.get(`/bookings/${id}`);
  return unwrap<Booking>(response.data);
};

/**
 * Backend route hiện tại là PATCH /bookings/:id/cancel.
 * Không tự thêm body "reason" ở mobile khi DTO cancel chưa cần nó.
 */
export const cancelClientBookingAPI = async (id: number): Promise<Booking> => {
  const response = await api.patch(`/bookings/${id}/cancel`);
  return unwrap<Booking>(response.data);
};

export const createRatingAPI = async (payload: CreateRatingPayload): Promise<Rating> => {
  const response = await api.post('/ratings', payload);
  return unwrap<Rating>(response.data);
};

export const updateRatingAPI = async (
  ratingId: number,
  payload: UpdateRatingPayload,
): Promise<Rating> => {
  const response = await api.patch(`/ratings/${ratingId}`, payload);
  return unwrap<Rating>(response.data);
};

export const getMyRatingByBookingAPI = async (bookingId: number): Promise<Rating | null> => {
  try {
    const response = await api.get(`/ratings/booking/${bookingId}`);
    return unwrap<Rating>(response.data);
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

export const getTherapistRatingsAPI = async (therapistId: number): Promise<Rating[]> => {
  const response = await api.get(`/ratings/therapist/${therapistId}`, {
    params: { page: 1, limit: 10 },
  });
  return asItems<Rating>(response.data);
};
