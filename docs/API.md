# REST API

Interactive OpenAPI documentation is available at `/docs` when the backend is running.

## Authentication

- `POST /auth/register` - create a driver account.
- `POST /auth/login` - return JWT bearer token.
- `POST /auth/logout` - stateless logout endpoint.

## Parking

- `GET /parking/slots` - list all parking slots.
- `GET /parking/available` - list available slots.
- `POST /parking/reserve` - reserve a slot.
- `DELETE /parking/cancel/{reservation_id}` - cancel a reservation.

## AI

- `POST /ai/detect` - trigger detection for a camera/frame.
- `POST /ai/predict?horizon_hours=2` - forecast occupancy.

## Admin

- `GET /admin/dashboard` - live occupancy, reservations, and revenue.
- `GET /admin/reports` - daily, weekly, and monthly reports.
- `GET /admin/revenue` - revenue summary.

## Payments

- `POST /payments/payment` - create payment record.
- `GET /payments/invoice/{payment_id}` - retrieve invoice metadata.
