import type { UserRoleValue } from '@/constants/common.constant';

export interface AuthUser {
  id?: number;
  sub?: number;
  fullName?: string;
  phone?: string;
  email?: string | null;
  role: UserRoleValue;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface LoginPayload {
  login: string;
  password: string;
  deviceName?: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: 'therapist';
  deviceName?: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
}
