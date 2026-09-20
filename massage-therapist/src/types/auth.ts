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
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType?: 'Bearer';
  expiresIn?: number;
};
