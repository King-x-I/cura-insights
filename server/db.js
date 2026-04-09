const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'cura.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('consumer', 'provider', 'admin')),
    user_metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consumer_details (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    profile_picture TEXT,
    preferred_language TEXT,
    emergency_contact TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS provider_details (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT,
    service_type TEXT NOT NULL DEFAULT 'driver',
    experience_years INTEGER,
    skills TEXT,
    govt_id_url TEXT,
    license_url TEXT,
    profile_picture TEXT,
    languages TEXT,
    id_type TEXT NOT NULL DEFAULT 'default',
    id_number TEXT NOT NULL DEFAULT 'default',
    driving_license_number TEXT,
    vehicle_type TEXT,
    license_expiry_date TEXT,
    working_hours_from TEXT,
    working_hours_to TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'pending',
    is_online INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    consumer_id TEXT REFERENCES users(id),
    provider_id TEXT,
    service_type TEXT NOT NULL,
    booking_status TEXT NOT NULL DEFAULT 'finding_provider',
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    location_pickup TEXT,
    location_drop TEXT,
    price_estimate REAL,
    date_time TEXT NOT NULL,
    service_details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    message TEXT NOT NULL,
    type TEXT,
    booking_id TEXT,
    seen INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    customer_id TEXT NOT NULL REFERENCES users(id),
    service_type TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    details TEXT,
    provider_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    booking_id TEXT REFERENCES bookings(id),
    user_id TEXT REFERENCES users(id),
    amount REAL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS location_tracking (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, booking_id)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_consumer_user_id ON consumer_details(user_id);
  CREATE INDEX IF NOT EXISTS idx_provider_user_id ON provider_details(user_id);
  CREATE INDEX IF NOT EXISTS idx_provider_status ON provider_details(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON bookings(consumer_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  CREATE INDEX IF NOT EXISTS idx_location_user_booking ON location_tracking(user_id, booking_id);
`);

// Seed admin user if not exists
const bcrypt = require('bcryptjs');
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@admin.com');
if (!adminExists) {
  const adminId = uuidv4();
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (id, email, password_hash, full_name, user_type) VALUES (?, ?, ?, ?, ?)`).run(
    adminId, 'admin@admin.com', hash, 'Admin', 'admin'
  );
  console.log('Admin user seeded: admin@admin.com / admin123');
}

module.exports = db;
