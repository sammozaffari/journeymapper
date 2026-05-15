-- ============================================
-- FIX: RLS circular dependency on workspace_members
-- ============================================

-- Create a SECURITY DEFINER function that checks workspace membership
-- without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop all existing workspace_members SELECT policies
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Recreate with a simple self-check (no recursion)
CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- Now update all other tables' SELECT policies to use the function too
-- This prevents the chain of RLS checks from recursing

-- Workspaces
DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT USING (id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Projects
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects" ON projects
  FOR SELECT USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Journey maps
DROP POLICY IF EXISTS "Members can view journey maps" ON journey_maps;
CREATE POLICY "Members can view journey maps" ON journey_maps
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Stages
DROP POLICY IF EXISTS "Members can view stages" ON stages;
CREATE POLICY "Members can view stages" ON stages
  FOR SELECT USING (
    journey_map_id IN (
      SELECT id FROM journey_maps WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
      )
    )
  );

-- Lanes
DROP POLICY IF EXISTS "Members can view lanes" ON lanes;
CREATE POLICY "Members can view lanes" ON lanes
  FOR SELECT USING (
    journey_map_id IN (
      SELECT id FROM journey_maps WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
      )
    )
  );

-- Map nodes
DROP POLICY IF EXISTS "Members can view nodes" ON map_nodes;
CREATE POLICY "Members can view nodes" ON map_nodes
  FOR SELECT USING (
    journey_map_id IN (
      SELECT id FROM journey_maps WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
      )
    )
  );

-- Map edges
DROP POLICY IF EXISTS "Members can view edges" ON map_edges;
CREATE POLICY "Members can view edges" ON map_edges
  FOR SELECT USING (
    journey_map_id IN (
      SELECT id FROM journey_maps WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
      )
    )
  );

-- Research items
DROP POLICY IF EXISTS "Members can view research" ON research_items;
CREATE POLICY "Members can view research" ON research_items
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Findings
DROP POLICY IF EXISTS "Members can view findings" ON findings;
CREATE POLICY "Members can view findings" ON findings
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Personas
DROP POLICY IF EXISTS "Members can view personas" ON personas;
CREATE POLICY "Members can view personas" ON personas
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Stakeholders
DROP POLICY IF EXISTS "Members can view stakeholders" ON stakeholders;
CREATE POLICY "Members can view stakeholders" ON stakeholders
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Problem statements
DROP POLICY IF EXISTS "Members can view problem statements" ON problem_statements;
CREATE POLICY "Members can view problem statements" ON problem_statements
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Comments
DROP POLICY IF EXISTS "Members can view comments" ON comments;
CREATE POLICY "Members can view comments" ON comments
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- AI conversations
DROP POLICY IF EXISTS "Members can view AI conversations" ON ai_conversations;
CREATE POLICY "Members can view AI conversations" ON ai_conversations
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Exports
DROP POLICY IF EXISTS "Members can view exports" ON exports;
CREATE POLICY "Members can view exports" ON exports
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Themes
DROP POLICY IF EXISTS "Members can view themes" ON themes;
CREATE POLICY "Members can view themes" ON themes
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- Map versions
DROP POLICY IF EXISTS "Members can view versions" ON map_versions;
CREATE POLICY "Members can view versions" ON map_versions
  FOR SELECT USING (
    journey_map_id IN (
      SELECT id FROM journey_maps WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
      )
    )
  );

-- Finding node links
DROP POLICY IF EXISTS "Members can view finding links" ON finding_node_links;
CREATE POLICY "Members can view finding links" ON finding_node_links
  FOR SELECT USING (
    finding_id IN (SELECT id FROM findings WHERE project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    ))
  );

-- Persona journey links
DROP POLICY IF EXISTS "Members can view persona links" ON persona_journey_links;
CREATE POLICY "Members can view persona links" ON persona_journey_links
  FOR SELECT USING (
    persona_id IN (SELECT id FROM personas WHERE project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    ))
  );

-- Project guests
DROP POLICY IF EXISTS "Project members can view guests" ON project_guests;
CREATE POLICY "Project members can view guests" ON project_guests
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())))
  );

-- ============================================
-- CLEANUP: Remove duplicate workspaces
-- ============================================

DELETE FROM workspace_members
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM workspace_members
  ORDER BY user_id, joined_at ASC
);

DELETE FROM workspaces
WHERE id NOT IN (SELECT workspace_id FROM workspace_members);
