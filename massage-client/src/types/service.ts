export interface ServiceOption {
  id: number;
  serviceId?: number;
  name?: string;
  label?: string;
  description?: string | null;
  durationMinutes: number;
  defaultPrice?: number | string | null;
  price?: number | string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Service {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  options?: ServiceOption[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
