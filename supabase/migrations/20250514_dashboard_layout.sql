ALTER TABLE settings ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT NULL;
