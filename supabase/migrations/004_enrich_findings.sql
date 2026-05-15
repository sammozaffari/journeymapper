-- Add ProcessGap and Decision to finding_type enum
-- (Postgres CHECK constraints need to be dropped and recreated)

ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_finding_type_check;
ALTER TABLE findings ADD CONSTRAINT findings_finding_type_check
  CHECK (finding_type IN ('insight', 'quote', 'pain_point', 'need', 'behavior', 'opportunity', 'decision', 'process_gap', 'action'));

-- Add severity to findings (was only on map_nodes before)
ALTER TABLE findings ADD COLUMN IF NOT EXISTS severity TEXT
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Add stakeholder field
ALTER TABLE findings ADD COLUMN IF NOT EXISTS stakeholder TEXT;

-- Add recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  insight_id UUID REFERENCES findings(id) ON DELETE SET NULL,
  node_id UUID REFERENCES map_nodes(id) ON DELETE SET NULL,
  solution_type TEXT CHECK (solution_type IN ('process_change', 'ui_improvement', 'training', 'policy_update', 'communication', 'technology', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  effort TEXT CHECK (effort IN ('low', 'medium', 'high')),
  owner TEXT,
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recommendations_project ON recommendations(project_id);

-- RLS for recommendations
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view recommendations" ON recommendations
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

CREATE POLICY "Editors can manage recommendations" ON recommendations
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );
