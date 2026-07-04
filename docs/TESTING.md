# Testing Strategy

- Unit tests: service logic, validators, authentication helpers.
- Integration tests: FastAPI endpoints with test database.
- UI tests: reservation, payment, dashboard, dark mode, and reports.
- Load tests: availability reads, reservation conflict handling, dashboard analytics.
- AI validation: per-camera precision, recall, F1 score, FPS, and false occupancy rate.

## Core Test Cases

1. Register user with valid details returns `201`.
2. Duplicate email registration returns `409`.
3. Login with valid credentials returns bearer token.
4. Available slots endpoint returns only `available` slots.
5. Reservation conflicts return `409`.
6. Admin dashboard rejects driver token with `403`.
7. Detection pipeline marks slot occupied when vehicle center lies inside slot polygon.
8. Forecast endpoint returns bounded occupancy between 0 and 100.
