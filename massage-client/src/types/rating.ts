export interface Rating {
  id: number;
  bookingId: number;
  clientId?: number;
  therapistId: number;
  rating: number;
  comment?: string | null;
  isVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
  client?: {
    user?: {
      fullName?: string;
    };
  };
}

export interface CreateRatingPayload {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface UpdateRatingPayload {
  rating?: number;
  comment?: string;
}
