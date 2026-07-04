INSERT INTO users (email, full_name, password_hash, role)
VALUES
    ('admin@smartparking.local', 'System Admin', '$2b$12$replace-with-real-hash', 'admin'),
    ('driver@smartparking.local', 'Demo Driver', '$2b$12$replace-with-real-hash', 'driver');

INSERT INTO cameras (name, stream_url, location)
VALUES ('Gate A Camera', 'rtsp://example.local/stream-a', 'Ground Level - Zone A');

INSERT INTO parking_slots (code, level, zone, status, slot_type, camera_id, polygon_json)
VALUES
    ('A-001', 'G', 'A', 'available', 'standard', 1, '[[120,210],[220,205],[238,315],[105,320]]'),
    ('A-002', 'G', 'A', 'available', 'ev', 1, '[[245,205],[345,205],[360,315],[238,315]]'),
    ('A-003', 'G', 'A', 'available', 'disabled', 1, NULL);
