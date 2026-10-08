import { create } from 'zustand';

interface RealtimeState {
  bookingRevision: number;
  availabilityRevision: number;
  bumpBookingRevision: () => void;
  bumpAvailabilityRevision: () => void;
  bumpBookingAndAvailability: () => void;
}

export const useRealtimeStore = create<RealtimeState>(set => ({
  bookingRevision: 0,
  availabilityRevision: 0,

  bumpBookingRevision: () =>
    set(state => ({
      bookingRevision: state.bookingRevision + 1,
    })),

  bumpAvailabilityRevision: () =>
    set(state => ({
      availabilityRevision: state.availabilityRevision + 1,
    })),

  bumpBookingAndAvailability: () =>
    set(state => ({
      bookingRevision: state.bookingRevision + 1,
      availabilityRevision: state.availabilityRevision + 1,
    })),
}));
