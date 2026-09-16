import type { UserRole } from '@/constants/common.constant';

export interface AuthUser {
  id?: number;
  sub?: number;
  fullName?: string;
  phone?: string;
  email?: string | null;
  role: UserRole | 'client' | 'therapist' | 'super_admin' | 'system_admin';
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
  role: 'client' | 'therapist';
  deviceName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends Partial<AuthTokens> {
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
}
