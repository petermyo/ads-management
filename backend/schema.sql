-- backend/schema.sql

-- Table for Users
CREATE TABLE IF NOT EXISTS users_table (
    id TEXT PRIMARY KEY,
    created INTEGER,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    sessions INTEGER DEFAULT 0
);

-- Table for Ads Orders
CREATE TABLE IF NOT EXISTS ads_order_table (
    id TEXT PRIMARY KEY,
    created INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    budget REAL NOT NULL,
    days INTEGER NOT NULL,
    platform TEXT NOT NULL,
    objective TEXT NOT NULL,
    auction TEXT,
    estimated_impression INTEGER,
    estimated_click INTEGER,
    estimated_ctr REAL
);

-- Table for Ads Invoices
CREATE TABLE IF NOT EXISTS ads_invoices (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    month TEXT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    attachments TEXT
);
