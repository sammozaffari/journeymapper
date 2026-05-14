-- ============================================
-- CORE MULTI-TENANT STRUCTURE
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspaces (tenants)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace members
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_email TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
CREATE INDEX idx_wm_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_wm_user ON workspace_members(user_id);

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'template')),
  cover_image_url TEXT,
  settings JSONB DEFAULT '{}',
  template_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);

-- Project-level guest access (magic links)
CREATE TABLE project_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'commenter')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- JOURNEY MAPS
-- ============================================

CREATE TABLE journey_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  mode TEXT DEFAULT 'blueprint' CHECK (mode IN ('blueprint', 'freeform')),
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  settings JSONB DEFAULT '{}',
  version INT DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_jm_project ON journey_maps(project_id);

-- Stages (columns in blueprint mode)
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL,
  width FLOAT DEFAULT 300,
  color TEXT DEFAULT '#E2E8F0',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_stages_jm ON stages(journey_map_id);

-- Swim lanes (rows in blueprint mode)
CREATE TABLE lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE NOT NULL,
  lane_type TEXT NOT NULL CHECK (lane_type IN (
    'customer_actions', 'frontstage', 'backstage',
    'support_processes', 'physical_evidence', 'emotional_journey', 'custom'
  )),
  label TEXT NOT NULL,
  sort_order INT NOT NULL,
  height FLOAT DEFAULT 200,
  color TEXT DEFAULT '#F7FAFC',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_lanes_jm ON lanes(journey_map_id);

-- Nodes (touchpoints, pain points, opportunities, etc.)
CREATE TABLE map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  lane_id UUID REFERENCES lanes(id) ON DELETE SET NULL,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'touchpoint', 'pain_point', 'opportunity', 'moment_of_truth',
    'evidence_item', 'action', 'emotion', 'note', 'image'
  )),
  label TEXT NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT DEFAULT 180,
  height FLOAT DEFAULT 80,
  sentiment FLOAT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  icon TEXT,
  color TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nodes_jm ON map_nodes(journey_map_id);
CREATE INDEX idx_nodes_stage ON map_nodes(stage_id);
CREATE INDEX idx_nodes_lane ON map_nodes(lane_id);

-- Edges (connections between nodes)
CREATE TABLE map_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE NOT NULL,
  source_node_id UUID REFERENCES map_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES map_nodes(id) ON DELETE CASCADE NOT NULL,
  edge_type TEXT DEFAULT 'flow' CHECK (edge_type IN (
    'flow', 'dependency', 'interaction', 'line_of_visibility', 'custom'
  )),
  label TEXT,
  animated BOOLEAN DEFAULT false,
  style JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_edges_jm ON map_edges(journey_map_id);

-- Version history snapshots
CREATE TABLE map_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RESEARCH
-- ============================================

CREATE TABLE research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'transcript', 'survey', 'notes', 'external_import', 'interview_guide', 'observation'
  )),
  raw_content TEXT,
  file_url TEXT,
  file_type TEXT,
  ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_extracted JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_research_project ON research_items(project_id);

-- Research findings
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  research_item_id UUID REFERENCES research_items(id) ON DELETE SET NULL,
  finding_type TEXT CHECK (finding_type IN ('insight', 'quote', 'pain_point', 'need', 'behavior', 'opportunity')),
  content TEXT NOT NULL,
  sentiment FLOAT,
  theme TEXT,
  tags TEXT[] DEFAULT '{}',
  source_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_findings_project ON findings(project_id);

-- Link findings to map nodes
CREATE TABLE finding_node_links (
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  node_id UUID REFERENCES map_nodes(id) ON DELETE CASCADE,
  PRIMARY KEY (finding_id, node_id)
);

-- Research themes (AI-generated clusters)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  frequency INT DEFAULT 0,
  sentiment_avg FLOAT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PERSONAS & STAKEHOLDERS
-- ============================================

CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  demographics JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  frustrations TEXT[] DEFAULT '{}',
  behaviors TEXT[] DEFAULT '{}',
  quotes TEXT[] DEFAULT '{}',
  bio TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_personas_project ON personas(project_id);

-- Link personas to journey maps
CREATE TABLE persona_journey_links (
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  journey_map_id UUID REFERENCES journey_maps(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, journey_map_id)
);

CREATE TABLE stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  influence TEXT CHECK (influence IN ('low', 'medium', 'high')),
  interest TEXT CHECK (interest IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROBLEM STATEMENTS
-- ============================================

CREATE TABLE problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  statement TEXT NOT NULL,
  context TEXT,
  impact TEXT,
  current_state TEXT,
  desired_state TEXT,
  constraints TEXT[] DEFAULT '{}',
  assumptions TEXT[] DEFAULT '{}',
  linked_research_ids UUID[] DEFAULT '{}',
  linked_journey_map_ids UUID[] DEFAULT '{}',
  is_ai_refined BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COMMENTS & ANNOTATIONS
-- ============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('node', 'edge', 'stage', 'lane', 'journey_map', 'research_item', 'persona')),
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  position JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_comments_target ON comments(target_type, target_id);

-- ============================================
-- AI CONVERSATIONS
-- ============================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  conversation_type TEXT CHECK (conversation_type IN ('guided_mapping', 'research_analysis', 'problem_refinement', 'general')),
  messages JSONB DEFAULT '[]',
  generated_artifacts JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXPORTS
-- ============================================

CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('pptx', 'pdf', 'png', 'interactive_link')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  share_token TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
