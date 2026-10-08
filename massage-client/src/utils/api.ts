import api from '@/utils/axios.customize';

import type {
  AuthResponse,
  AuthUser,
  Booking,
  ClientBookingsQuery,
  ClientBookingsResponse,
  CreateClientBookingPayload,
  CreateRatingPayload,
  LoginPayload,
  Rating,
  RegisterPayload,
  RegisterResponse,
  SendRegistrationOtpPayload,
  SendRegistrationOtpResponse,
  Service,
  TherapistAvailabilityCheckResult,
  TherapistAvailabilitySlotsResult,
  TherapistSearchParams,
  TherapistSearchResult,
  TherapistSummary,
  UpdateRatingPayload,
  VerifyRegistrationOtpPayload,
  VerifyRegistrationOtpResponse,
} from '@/types';

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;

const asItems = <T>(payload: any): T[] => {
  const data = unwrap<any>(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (Array.isArray(data?.items)) {
    return data.items as T[];
  }

  if (Array.isArray(data?.data)) {
    return data.data as T[];
  }

  return [];
};

export const loginAPI = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', payload);

  return unwrap<AuthResponse>(response.data);
};

export const registerAPI = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', payload);

  return unwrap<RegisterResponse>(response.data);
};

export const sendRegistrationOtpAPI = async (
  payload: SendRegistrationOtpPayload,
): Promise<SendRegistrationOtpResponse> => {
  const response = await api.post('/auth/otp/send', payload);

  return unwrap<SendRegistrationOtpResponse>(response.data);
};

export const verifyRegistrationOtpAPI = async (
  payload: VerifyRegistrationOtpPayload,
): Promise<VerifyRegistrationOtpResponse> => {
  const response = await api.post('/auth/otp/verify', payload);

  return unwrap<VerifyRegistrationOtpResponse>(response.data);
};

export const refreshTokenAPI = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/refresh', {
    refreshToken,
  });

  return unwrap<AuthResponse>(response.data);
};

export const logoutAPI = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', {
    refreshToken,
  });
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
  /**
   * Chỉ gửi đúng các field Search DTO hiện tại chấp nhận.
   *
   * Tuyệt đối không:
   *
   * ...params
   *
   * vì object từ UI có thể chứa field của flow cũ.
   */
  const response = await api.get('/therapists/search', {
    params: {
      serviceId: params.serviceId,

      ...(params.latitude !== undefined
        ? {
            latitude: params.latitude,
          }
        : {}),

      ...(params.longitude !== undefined
        ? {
            longitude: params.longitude,
          }
        : {}),

      ...(params.districtCode?.trim()
        ? {
            districtCode: params.districtCode.trim(),
          }
        : {}),

      ...(params.provinceCode?.trim()
        ? {
            provinceCode: params.provinceCode.trim(),
          }
        : {}),

      ...(params.sortBy
        ? {
            sortBy: params.sortBy,
          }
        : {}),

      page: params.page ?? 1,

      limit: params.limit ?? 12,
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
    .filter(
      item => Number.isInteger(item.therapistId) && item.therapistId > 0,
    ) as TherapistSummary[];

  const fallbackPage = params.page ?? 1;

  const fallbackLimit = params.limit ?? 12;

  return {
    items,

    pagination: data?.pagination ?? {
      page: fallbackPage,

      limit: fallbackLimit,

      total: items.length,

      totalPages: items.length ? 1 : 0,
    },
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

  return result.items.find(item => Number(item.therapistId ?? item.id) === therapistId) ?? null;
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

export const getClientBookingsAPI = async (
  query: ClientBookingsQuery = {},
): Promise<ClientBookingsResponse> => {
  const page = query.page ?? 1;

  const limit = query.limit ?? 10;

  const response = await api.get('/bookings', {
    params: {
      page,
      limit,

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
    },
  });

  const data = unwrap<any>(response.data);

  if (Array.isArray(data)) {
    return {
      items: data as Booking[],

      pagination: {
        page: 1,

        limit: data.length || limit,

        total: data.length,

        totalPages: data.length ? 1 : 0,
      },
    };
  }

  const items = Array.isArray(data?.items)
    ? (data.items as Booking[])
    : Array.isArray(data?.data)
      ? (data.data as Booking[])
      : [];

  const pagination = data?.pagination ?? {};

  return {
    items,

    pagination: {
      page: Number(pagination.page ?? page),

      limit: Number(pagination.limit ?? limit),

      total: Number(pagination.total ?? items.length),

      totalPages: Number(
        pagination.totalPages ?? (items.length ? Math.max(1, Math.ceil(items.length / limit)) : 0),
      ),
    },
  };
};

export const getClientBookingAPI = async (id: number): Promise<Booking> => {
  const response = await api.get(`/bookings/${id}`);

  return unwrap<Booking>(response.data);
};

export const cancelClientBookingAPI = async (id: number, reason: string): Promise<Booking> => {
  const response = await api.patch(`/bookings/${id}/cancel`, {
    reason: reason.trim(),
  });

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
    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export const getTherapistRatingsAPI = async (therapistId: number): Promise<Rating[]> => {
  const response = await api.get(`/ratings/therapist/${therapistId}`, {
    params: {
      page: 1,
      limit: 10,
    },
  });

  return asItems<Rating>(response.data);
};
