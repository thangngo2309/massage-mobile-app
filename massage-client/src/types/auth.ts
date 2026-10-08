import type { UserRole } from '@/constants/common.constant';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AuthUser {
  id?: number;
  sub?: number;
  fullName?: string;
  phone?: string;
  email?: string | null;
  role: UserRole | 'client' | 'therapist' | 'super_admin' | 'system_admin';
  status?: UserStatus;
  lastLoginAt?: string | null;
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
  referralCode?: string;
}

/**
 * Backend hiện tại tạo user ở trạng thái inactive và yêu cầu xác thực OTP.
 * Register không được coi là một phiên đăng nhập.
 */
export interface RegisterResponse {
  user: AuthUser;
  requiresOtp: boolean;
  message: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends Partial<AuthTokens> {
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
  tokenType?: 'Bearer' | string;
  expiresIn?: number;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresAt?: string;
}

export interface SendRegistrationOtpPayload {
  phone: string;
}

export interface SendRegistrationOtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  resendAfter?: number;
}

export interface VerifyRegistrationOtpPayload {
  phone: string;
  code: string;
}

export interface VerifyRegistrationOtpResponse {
  success: boolean;
  message: string;
}
