
import api from '@/utils/axios.customize';

import type {
  AuthResponse,
  AuthUser,
  Booking,
  BookingListResponse,
  BookingStatus,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ScheduleException,
  SendRegistrationOtpPayload,
  SendRegistrationOtpResponse,
  TherapistProfile,
  TherapistRatingsResponse,
  TherapistService,
  VerifyRegistrationOtpPayload,
  VerifyRegistrationOtpResponse,
  WorkingHour,
} from '@/types';

export const loginAPI = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', payload);

  return response.data;
};

export const registerAPI = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const sendRegistrationOtpAPI = async (
  payload: SendRegistrationOtpPayload,
): Promise<SendRegistrationOtpResponse> => {
  const response = await api.post('/auth/otp/send', payload);

  return response.data;
};

export const verifyRegistrationOtpAPI = async (
  payload: VerifyRegistrationOtpPayload,
): Promise<VerifyRegistrationOtpResponse> => {
  const response = await api.post('/auth/otp/verify', payload);

  return response.data;
};

export const meAPI = async (): Promise<AuthUser> => {
  const response = await api.get('/auth/me');

  return response.data;
};

export const logoutAPI = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', {
    refreshToken,
  });
};

export const getTherapistProfileAPI = async (): Promise<TherapistProfile> => {
  const response = await api.get('/therapist/me');

  return response.data;
};

export const updateTherapistProfileAPI = async (payload: {
  fullName: string;
  bio?: string | null;
  experienceYears?: number | null;
}): Promise<TherapistProfile> => {
  const response = await api.patch('/therapist/me', payload);
  return response.data;
};

export const updateAcceptingBookingsAPI = async (
  isAcceptingBookings: boolean,
): Promise<TherapistProfile> => {
  const response = await api.patch('/therapist/me/accepting-bookings', {
    isAcceptingBookings,
  });
  return response.data;
};

export const getTherapistServicesAPI = async (): Promise<TherapistService[]> => {
  const response = await api.get('/therapist/me/services');
  return response.data;
};

export const updateTherapistServiceAPI = async (
  id: number,
  payload: {
    price: number;
    isActive: boolean;
  },
): Promise<TherapistService> => {
  const response = await api.patch(`/therapist/me/services/${id}`, payload);
  return response.data;
};

export const getWorkingHoursAPI = async (): Promise<WorkingHour[]> => {
  const response = await api.get('/therapist/me/working-hours');
  return response.data;
};

export const replaceWorkingHoursAPI = async (items: WorkingHour[]): Promise<WorkingHour[]> => {
  const response = await api.put('/therapist/me/working-hours', {
    items: items.map(item => ({
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      isActive: item.isActive,
    })),
  });

  return response.data;
};

export const getScheduleExceptionsAPI = async (): Promise<ScheduleException[]> => {
  const response = await api.get('/therapist/me/schedule-exceptions');
  return response.data;
};

export const createScheduleExceptionAPI = async (payload: {
  date: string;
  isDayOff: boolean;
  startTime?: string;
  endTime?: string;
  note?: string;
}): Promise<ScheduleException> => {
  const response = await api.post('/therapist/me/schedule-exceptions', payload);
  return response.data;
};

export const deleteScheduleExceptionAPI = async (id: number): Promise<void> => {
  await api.delete(`/therapist/me/schedule-exceptions/${id}`);
};

export const getTherapistBookingsAPI = async (params?: {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  from?: string;
  to?: string;
}): Promise<BookingListResponse> => {
  const response = await api.get('/therapist/bookings', {
    params,
  });

  return response.data;
};

export const getTherapistBookingAPI = async (id: number): Promise<Booking> => {
  const response = await api.get(`/therapist/bookings/${id}`);
  return response.data;
};

export const updateTherapistBookingStatusAPI = async (
  id: number,
  status: BookingStatus,
  reason?: string,
): Promise<Booking> => {
  const response = await api.patch(`/therapist/bookings/${id}/status`, {
    status,
    reason: reason?.trim() || undefined,
  });

  return response.data;
};

export const getTherapistRatingsAPI = async (
  therapistId: number,
  page = 1,
  limit = 5,
): Promise<TherapistRatingsResponse> => {
  const response = await api.get(`/ratings/therapist/${therapistId}`, {
    params: {
      page,

      limit,
    },
  });

  return response.data;
};

