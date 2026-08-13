-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS messaging_settings CASCADE;

-- Add messaging settings table
CREATE TABLE messaging_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  read_receipts_enabled BOOLEAN DEFAULT true NOT NULL,
  online_status_enabled BOOLEAN DEFAULT true NOT NULL,
  typing_indicators_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX messaging_settings_customer_id_idx ON messaging_settings(customer_id);

-- Create default settings for existing customers
INSERT INTO messaging_settings (customer_id, read_receipts_enabled, online_status_enabled, typing_indicators_enabled)
SELECT id, true, true, true FROM customers;
