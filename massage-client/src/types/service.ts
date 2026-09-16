export interface ServiceOption {
  id: number;
  serviceId?: number;
  name?: string;
  label?: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | string | null;
  isActive?: boolean;
}

export interface Service {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  options?: ServiceOption[];
}
