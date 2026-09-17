import type {
  AuthResponse,
  AuthUser,
  BookingStatus,
  CreateScheduleExceptionPayload,
  LoginPayload,
  RegisterPayload,
  TherapistBooking,
  TherapistScheduleException,
  TherapistSelfProfile,
  TherapistServiceItem,
  TherapistWorkingHour,
  WorkingHourInput,
} from '@/types';
import api from '@/utils/axios.customize';

const unwrap = <T>(payload: any): T => (payload?.data ?? payload) as T;

const asItems = <T>(payload: any): T[] => {
  const data = unwrap<any>(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
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

export const logoutAPI = async (refreshToken: string) => {
  await api.post('/auth/logout', { refreshToken });
};

export const getAccountAPI = async (): Promise<AuthUser> => {
  const response = await api.get('/auth/me');
  return unwrap<AuthUser>(response.data);
};

export const getTherapistSelfAPI = async (): Promise<TherapistSelfProfile> => {
  const response = await api.get('/therapist/me');
  return unwrap<TherapistSelfProfile>(response.data);
};

export const updateTherapistSelfAPI = async (payload: {
  fullName: string;
  bio?: string;
  experienceYears: number;
}): Promise<TherapistSelfProfile> => {
  const response = await api.patch('/therapist/me', payload);
  return unwrap<TherapistSelfProfile>(response.data);
};

export const updateAcceptingBookingsAPI = async (
  isAcceptingBookings: boolean,
): Promise<TherapistSelfProfile> => {
  const response = await api.patch('/therapist/me/accepting-bookings', {
    isAcceptingBookings,
  });
  return unwrap<TherapistSelfProfile>(response.data);
};

export const getTherapistServicesAPI = async (): Promise<TherapistServiceItem[]> => {
  const response = await api.get('/therapist/me/services');
  return asItems<TherapistServiceItem>(response.data);
};

export const updateTherapistServiceAPI = async (
  id: number,
  payload: { price: number; isActive: boolean },
): Promise<TherapistServiceItem> => {
  const response = await api.patch(`/therapist/me/services/${id}`, payload);
  return unwrap<TherapistServiceItem>(response.data);
};

export const getWorkingHoursAPI = async (): Promise<TherapistWorkingHour[]> => {
  const response = await api.get('/therapist/me/working-hours');
  return asItems<TherapistWorkingHour>(response.data);
};

export const replaceWorkingHoursAPI = async (
  items: WorkingHourInput[],
): Promise<TherapistWorkingHour[]> => {
  const response = await api.put('/therapist/me/working-hours', { items });
  return asItems<TherapistWorkingHour>(response.data);
};

export const getScheduleExceptionsAPI = async (): Promise<TherapistScheduleException[]> => {
  const response = await api.get('/therapist/me/schedule-exceptions');
  return asItems<TherapistScheduleException>(response.data);
};

export const createScheduleExceptionAPI = async (
  payload: CreateScheduleExceptionPayload,
): Promise<TherapistScheduleException> => {
  const response = await api.post('/therapist/me/schedule-exceptions', payload);
  return unwrap<TherapistScheduleException>(response.data);
};

export const deleteScheduleExceptionAPI = async (id: number) => {
  await api.delete(`/therapist/me/schedule-exceptions/${id}`);
};

export const getTherapistBookingsAPI = async (): Promise<TherapistBooking[]> => {
  const response = await api.get('/therapist/bookings');
  return asItems<TherapistBooking>(response.data);
};

export const getTherapistBookingAPI = async (id: number): Promise<TherapistBooking> => {
  const response = await api.get(`/therapist/bookings/${id}`);
  return unwrap<TherapistBooking>(response.data);
};

export const updateTherapistBookingStatusAPI = async (
  id: number,
  status: BookingStatus,
): Promise<TherapistBooking> => {
  const response = await api.patch(`/therapist/bookings/${id}/status`, { status });
  return unwrap<TherapistBooking>(response.data);
};
