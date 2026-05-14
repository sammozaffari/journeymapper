-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper function: check if user is a workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role IN (
        CASE
          WHEN min_role = 'viewer' THEN 'viewer'
          WHEN min_role = 'editor' THEN NULL
          WHEN min_role = 'admin' THEN NULL
          WHEN min_role = 'owner' THEN NULL
        END,
        CASE
          WHEN min_role IN ('viewer', 'editor') THEN 'editor'
          WHEN min_role = 'admin' THEN NULL
          WHEN min_role = 'owner' THEN NULL
        END,
        CASE
          WHEN min_role IN ('viewer', 'editor', 'admin') THEN 'admin'
          WHEN min_role = 'owner' THEN NULL
        END,
        'owner'
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- ============================================
-- WORKSPACES
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update workspaces"
  ON workspaces FOR UPDATE USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- WORKSPACE MEMBERS
-- ============================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage members"
  ON workspace_members FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR user_id = auth.uid() -- allow self-join (for workspace creation)
  );

CREATE POLICY "Admins can update members"
  ON workspace_members FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can remove members"
  ON workspace_members FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR user_id = auth.uid() -- allow self-removal
  );

-- ============================================
-- PROJECTS
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view projects"
  ON projects FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors can create projects"
  ON projects FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
  );

CREATE POLICY "Editors can update projects"
  ON projects FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- PROJECT GUESTS
-- ============================================
ALTER TABLE project_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view guests"
  ON project_guests FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage guests"
  ON project_guests FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================
-- JOURNEY MAPS (and related tables)
-- Scope through project -> workspace membership
-- ============================================

ALTER TABLE journey_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_versions ENABLE ROW LEVEL SECURITY;

-- Journey maps
CREATE POLICY "Members can view journey maps"
  ON journey_maps FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage journey maps"
  ON journey_maps FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Stages
CREATE POLICY "Members can view stages"
  ON stages FOR SELECT USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage stages"
  ON stages FOR ALL USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Lanes
CREATE POLICY "Members can view lanes"
  ON lanes FOR SELECT USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage lanes"
  ON lanes FOR ALL USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Map nodes
CREATE POLICY "Members can view nodes"
  ON map_nodes FOR SELECT USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage nodes"
  ON map_nodes FOR ALL USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Map edges
CREATE POLICY "Members can view edges"
  ON map_edges FOR SELECT USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage edges"
  ON map_edges FOR ALL USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Map versions
CREATE POLICY "Members can view versions"
  ON map_versions FOR SELECT USING (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can create versions"
  ON map_versions FOR INSERT WITH CHECK (
    journey_map_id IN (
      SELECT jm.id FROM journey_maps jm
      JOIN projects p ON p.id = jm.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================
-- RESEARCH, FINDINGS, THEMES
-- ============================================

ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_node_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view research"
  ON research_items FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage research"
  ON research_items FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Members can view findings"
  ON findings FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage findings"
  ON findings FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Members can view finding links"
  ON finding_node_links FOR SELECT USING (
    finding_id IN (SELECT id FROM findings WHERE project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Editors can manage finding links"
  ON finding_node_links FOR ALL USING (
    finding_id IN (SELECT id FROM findings WHERE project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    ))
  );

CREATE POLICY "Members can view themes"
  ON themes FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage themes"
  ON themes FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================
-- PERSONAS, STAKEHOLDERS, PROBLEM STATEMENTS
-- ============================================

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_journey_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view personas"
  ON personas FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage personas"
  ON personas FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Members can view persona links"
  ON persona_journey_links FOR SELECT USING (
    persona_id IN (SELECT id FROM personas WHERE project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Editors can manage persona links"
  ON persona_journey_links FOR ALL USING (
    persona_id IN (SELECT id FROM personas WHERE project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    ))
  );

CREATE POLICY "Members can view stakeholders"
  ON stakeholders FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage stakeholders"
  ON stakeholders FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Members can view problem statements"
  ON problem_statements FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage problem statements"
  ON problem_statements FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================
-- COMMENTS, AI CONVERSATIONS, EXPORTS
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments"
  ON comments FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create comments"
  ON comments FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Comment authors can update"
  ON comments FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Comment authors can delete"
  ON comments FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Members can view AI conversations"
  ON ai_conversations FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage AI conversations"
  ON ai_conversations FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Members can view exports"
  ON exports FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage exports"
  ON exports FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'editor')
    )
  );
