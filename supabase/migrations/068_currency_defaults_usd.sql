-- Migration: Change default currency from NGN to USD across all tables.
-- This is a metadata-only change; existing rows keep their stored currency value.

ALTER TABLE products         ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE services         ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE digital_products ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE orders           ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE transactions     ALTER COLUMN currency SET DEFAULT 'USD';

-- payment_sessions table (from migration 031 / 040)
ALTER TABLE payment_sessions ALTER COLUMN currency SET DEFAULT 'USD';
