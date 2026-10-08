In Home Massage 247 - Client mobile source

Client flow synchronized from the current web portal and current backend contract:

- Authentication shell and persisted session.
- Client registration with phone OTP verification before login.
- Client-only role guard in the mobile auth store.
- Home tabs with Android/iOS safe-area aware bottom navigation.
- Service list search and service detail/options.
- Service option default price support (`defaultPrice`) aligned with web data.
- Therapist search by service option, date, time and location.
- Therapist search sorting and pagination.
- Therapist availability badge (`Có thể đặt` / `Không khả dụng`).
- Therapist detail, availability slots and public reviews.
- Booking confirmation with separate search location and service location.
- Final availability re-check immediately before booking creation.
- Client booking list with status filters and pagination.
- Client booking detail with status timeline.
- Client cancellation with a required reason.
- Create/update client rating after a completed booking.
- Realtime Socket.IO synchronization for booking and therapist availability changes.

The mobile app continues to use the backend API as the source of truth. Realtime events only trigger API refreshes; they do not replace backend state.
