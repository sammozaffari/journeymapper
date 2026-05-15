"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/stores/project-store";

export function useWorkspace() {
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    setWorkspaces,
    loading,
    setLoading,
  } = useProjectStore();

  const supabase = createClient();

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get workspaces user is a member of
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(*)")
        .eq("user_id", user.id);

      if (memberships && memberships.length > 0) {
        const ws = memberships.map((m) => m.workspaces as any);
        setWorkspaces(ws);
        if (!currentWorkspace) {
          setCurrentWorkspace(ws[0]);
        }
      } else {
        // Auto-create a workspace for new users
        const slug =
          user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ||
          `workspace-${Date.now()}`;

        const { data: newWorkspace } = await supabase
          .from("workspaces")
          .insert({
            name: "My Workspace",
            slug,
          })
          .select()
          .single();

        if (newWorkspace) {
          await supabase.from("workspace_members").insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: "owner",
          });

          setWorkspaces([newWorkspace]);
          setCurrentWorkspace(newWorkspace);
        }
      }

      setLoading(false);
    }

    loadWorkspace();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { currentWorkspace, workspaces, loading };
}
