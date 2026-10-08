
export type UserStatus = 'active' | 'inactive' | 'suspended';

export type AuthUser = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: 'therapist' | 'client' | 'super_admin' | 'system_admin';
  status: UserStatus;
  lastLoginAt?: string | null;
};

export type LoginPayload = {
  login: string;
  password: string;
  deviceName?: string;
};

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: 'therapist';
  deviceName?: string;
  referralCode?: string;
};

/**
 * Register KHÔNG còn trả accessToken/refreshToken.
 *
 * Sau register:
 * - user.status = inactive
 * - Backend gửi OTP
 * - requiresOtp = true
 */
export type RegisterResponse = {
  user: AuthUser;

  requiresOtp: boolean;

  message: string;
};

/**
 * Login sau khi user đã verify OTP
 * mới trả session.
 */
export type AuthResponse = {
  user: AuthUser;

  accessToken: string;

  refreshToken: string;

  tokenType?: 'Bearer' | string;

  expiresIn?: number;

  accessTokenExpiresIn?: number;

  refreshTokenExpiresAt?: string;
};

export type SendRegistrationOtpPayload = {
  phone: string;
};

export type SendRegistrationOtpResponse = {
  success: boolean;

  message: string;

  expiresIn?: number;

  resendAfter?: number;
};

export type VerifyRegistrationOtpPayload = {
  phone: string;

  code: string;
};

export type VerifyRegistrationOtpResponse = {
  success: boolean;

  message: string;
};

