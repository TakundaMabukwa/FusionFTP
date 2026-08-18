-- Run this in Supabase SQL Editor to create the tracking table
CREATE TABLE IF NOT EXISTS invoice_export_log (
  id SERIAL PRIMARY KEY,
  last_invoice_number INTEGER NOT NULL DEFAULT 0,
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  invoice_count INTEGER DEFAULT 0,
  filename TEXT,
  created_by TEXT DEFAULT 'system'
);

-- Insert initial record (update last_invoice_number to your actual last sent number)
INSERT INTO invoice_export_log (last_invoice_number, created_by)
VALUES (0, 'initial_setup')
ON CONFLICT DO NOTHING;

-- Index for quick lookup of latest export
CREATE INDEX IF NOT EXISTS idx_invoice_export_log_exported_at
ON invoice_export_log (exported_at DESC);
