CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'driver',
    phone VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    license_plate VARCHAR(32) NOT NULL UNIQUE,
    make VARCHAR(80),
    model VARCHAR(80),
    ev_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cameras (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    stream_url TEXT NOT NULL,
    location VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMP
);

CREATE TABLE parking_slots (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    level VARCHAR(32) NOT NULL DEFAULT 'G',
    zone VARCHAR(32) NOT NULL DEFAULT 'A',
    status VARCHAR(32) NOT NULL DEFAULT 'available',
    slot_type VARCHAR(32) NOT NULL DEFAULT 'standard',
    camera_id BIGINT REFERENCES cameras(id),
    polygon_json TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    slot_id BIGINT NOT NULL REFERENCES parking_slots(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    qr_token VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    provider VARCHAR(32) NOT NULL DEFAULT 'razorpay',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    invoice_number VARCHAR(64) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parking_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    slot_id BIGINT NOT NULL REFERENCES parking_slots(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    detected_plate VARCHAR(32)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'app',
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_snapshots (
    id BIGSERIAL PRIMARY KEY,
    snapshot_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL,
    occupied_slots INTEGER NOT NULL,
    reserved_slots INTEGER NOT NULL,
    utilization_percent NUMERIC(5, 2) NOT NULL
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    action VARCHAR(120) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    metadata_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_slots_status ON parking_slots(status);
CREATE INDEX idx_slots_status_type ON parking_slots(status, slot_type);
CREATE INDEX idx_reservations_slot_time ON reservations(slot_id, starts_at, ends_at);
CREATE INDEX idx_payments_status_created ON payments(status, created_at);
CREATE INDEX idx_history_entry_exit ON parking_history(entry_time, exit_time);
