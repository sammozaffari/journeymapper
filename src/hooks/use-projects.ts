"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/stores/project-store";

export function useProjects(workspaceId: string | undefined) {
  const { projects, setProjects, addProject, updateProject, removeProject, setLoading } =
    useProjectStore();

  const supabase = createClient();

  useEffect(() => {
    if (!workspaceId) return;

    async function loadProjects() {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .neq("status", "template")
        .order("updated_at", { ascending: false });

      if (data) {
        setProjects(data);
      }
      setLoading(false);
    }

    loadProjects();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createProject = useCallback(
    async (name: string, description?: string) => {
      if (!workspaceId) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name,
          description: description || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Project creation error:", error);
        return null;
      }

      if (data) {
        addProject(data);
        return data;
      }

      return null;
    },
    [workspaceId, supabase, addProject]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (!error) {
        removeProject(projectId);
      }
    },
    [supabase, removeProject]
  );

  const archiveProject = useCallback(
    async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", projectId);

      if (!error) {
        removeProject(projectId);
      }
    },
    [supabase, removeProject]
  );

  return { projects, createProject, deleteProject, archiveProject };
}
