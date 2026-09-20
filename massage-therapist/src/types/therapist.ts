export type TherapistProfile = {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  email: string | null;
  bio: string | null;
  gender: 'unknown' | 'male' | 'female' | 'other';
  dateOfBirth: string | null;
  experienceYears: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  onlineStatus: 'offline' | 'online' | 'busy';
  isAcceptingBookings: boolean;
  serviceRadiusKm: number;
  ratingAverage: number;
  ratingCount: number;
  completedBookings: number;
  createdAt: string;
  updatedAt: string;
};

export type TherapistService = {
  id: number;
  therapistId: number;
  serviceOptionId: number;
  serviceName: string;
  optionLabel: string;
  durationMinutes: number;
  defaultPrice: number;
  price: number;
  platformFeeRate: number;
  isActive: boolean;
};

export type WorkingHour = {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type ScheduleException = {
  id: number;
  date: string;
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  createdAt: string;
};
