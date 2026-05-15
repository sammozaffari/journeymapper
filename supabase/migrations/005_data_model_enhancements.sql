-- ============================================
-- P7: Data Model Enhancements
-- ============================================

-- Add channel to map_nodes (web, mobile, phone, in-person, email)
ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS channel TEXT
  CHECK (channel IN ('web', 'mobile', 'phone', 'in_person', 'email', 'physical', 'other'));

-- Add time/duration to stages (minutes)
ALTER TABLE stages ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Add KPI/metric fields to stages
ALTER TABLE stages ADD COLUMN IF NOT EXISTS kpi_label TEXT;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS kpi_value TEXT;

-- Add map_type to distinguish current-state vs future-state
ALTER TABLE journey_maps ADD COLUMN IF NOT EXISTS map_type TEXT DEFAULT 'current'
  CHECK (map_type IN ('current', 'future', 'ideal'));

-- Add linked_map_id for connecting current↔future state variants
ALTER TABLE journey_maps ADD COLUMN IF NOT EXISTS linked_map_id UUID REFERENCES journey_maps(id) ON DELETE SET NULL;

-- Add JTBD field to stages
ALTER TABLE stages ADD COLUMN IF NOT EXISTS jtbd TEXT;

-- Add channel to findings for tracking research source channels
ALTER TABLE findings ADD COLUMN IF NOT EXISTS channel TEXT;

-- Add project-level branding for white-label exports
ALTER TABLE projects ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
-- branding: { clientName, clientLogo (base64), accentColor (hex) }
