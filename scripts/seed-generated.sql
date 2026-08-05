-- Reporters (fixed tokens so you can immediately test /edit/[token] without digging through the DB)
INSERT INTO reporters (id, email, token, created_at) VALUES
  ('r1a1a1a1-0000-0000-0000-000000000001', 'maria@example.com', 'seed-token-maria-0001', unixepoch()),
  ('r2b2b2b2-0000-0000-0000-000000000002', 'james@example.com', 'seed-token-james-0002', unixepoch()),
  ('r3c3c3c3-0000-0000-0000-000000000003', 'aiko@example.com',  'seed-token-aiko-0003',  unixepoch());

-- Reports
INSERT INTO reports (
  id, reporter_email, license_plate, plate_state, vehicle_make, vehicle_model,
  vehicle_color, latitude, longitude, address, reason, notes, status, created_at, updated_at
) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'maria@example.com', '8ABC123', 'CA', 'Honda', 'Civic', 'Silver',
    34.0522, -118.2437, '1234 Sunset Blvd, Los Angeles, CA', '72_hours', 'Been here over a week, flat tire.', 'open', unixepoch()-604800, unixepoch()-604800),

  ('a2000000-0000-0000-0000-000000000002', 'james@example.com', '7XYZ789', 'CA', 'Toyota', 'Camry', 'Black',
    34.0407, -118.2468, '456 S Broadway, Los Angeles, CA', 'expired_tags', 'Tags expired 2024.', 'investigating', unixepoch()-432000, unixepoch()-86400),

  ('a3000000-0000-0000-0000-000000000003', 'aiko@example.com', '9LMN456', 'CA', 'Ford', 'F-150', 'Red',
    34.0224, -118.2851, '789 Crenshaw Blvd, Los Angeles, CA', 'other', 'Blocking bike lane, no plates.', 'open', unixepoch()-259200, unixepoch()-259200),

  ('a4000000-0000-0000-0000-000000000004', 'maria@example.com', '8ABC123', 'CA', 'Honda', 'Civic', 'Silver',
    34.0522, -118.2440, '1240 Sunset Blvd, Los Angeles, CA', '72_hours', 'Still here, now on cinder blocks.', 'open', unixepoch()-172800, unixepoch()-172800),

  ('a5000000-0000-0000-0000-000000000005', 'james@example.com', '3DEF321', 'NV', 'Chevrolet', 'Malibu', 'White',
    34.0195, -118.4912, '100 Ocean Ave, Santa Monica, CA', 'expired_tags', NULL, 'closed', unixepoch()-1209600, unixepoch()-518400),

  ('a6000000-0000-0000-0000-000000000006', 'aiko@example.com', '2GHI654', 'CA', 'Nissan', 'Altima', 'Gray',
    34.1478, -118.1445, '200 Colorado Blvd, Pasadena, CA', '72_hours', 'Windows broken, appears abandoned.', 'investigating', unixepoch()-345600, unixepoch()-43200),

  ('a7000000-0000-0000-0000-000000000007', 'maria@example.com', '5JKL987', 'CA', 'Jeep', 'Wrangler', 'Green',
    33.9850, -118.4695, '5500 Venice Blvd, Los Angeles, CA', 'other', 'Parked across two spots for weeks.', 'open', unixepoch()-86400, unixepoch()-86400),

  ('a8000000-0000-0000-0000-000000000008', 'james@example.com', '7XYZ789', 'CA', 'Toyota', 'Camry', 'Black',
    34.0407, -118.2470, '460 S Broadway, Los Angeles, CA', 'expired_tags', 'Same car, still expired.', 'investigating', unixepoch()-43200, unixepoch()-3600);

-- Votes (so vote_count / hasVoted have something to show)
INSERT INTO votes (id, report_id, voter_token, created_at) VALUES
  ('v1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'seed-voter-0001', unixepoch()),
  ('v2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'seed-voter-0002', unixepoch()),
  ('v3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'seed-voter-0003', unixepoch()),
  ('v4000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'seed-voter-0001', unixepoch()),
  ('v5000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000006', 'seed-voter-0002', unixepoch());
