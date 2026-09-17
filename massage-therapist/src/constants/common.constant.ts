export const UserRole = {
  CLIENT: 'client',
  THERAPIST: 'therapist',
  SUPER_ADMIN: 'super_admin',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const StorageKeys = {
  USER: 'massage_therapist_user',
  ACCESS_TOKEN: 'massage_therapist_access_token',
  REFRESH_TOKEN: 'massage_therapist_refresh_token',
} as const;
