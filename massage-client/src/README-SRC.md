Massage In Room - Expo client migration

Client flow migrated from the existing web portal:

- Authentication shell and persisted session.
- Home tabs with Android/iOS safe-area aware bottom navigation.
- Public service list and service detail/options.
- Therapist search by service option, date, time and location.
- Therapist detail, availability slots and public reviews.
- Booking confirmation with separate search location and service location.
- Final availability re-check immediately before booking creation.
- Client booking list and booking detail.
- Client cancellation for eligible early booking statuses; backend remains authoritative.
- Create/update client rating after a completed booking.

The source intentionally reuses the current backend API instead of duplicating business rules in the mobile app.
