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
      if (!user) {
        setLoading(false);
        return;
      }

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
        // Auto-create via API route (uses admin client to bypass RLS)
        try {
          const res = await fetch("/api/workspace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (res.ok) {
            const newWorkspace = await res.json();
            setWorkspaces([newWorkspace]);
            setCurrentWorkspace(newWorkspace);
          }
        } catch (err) {
          console.error("Failed to auto-create workspace:", err);
        }
      }

      setLoading(false);
    }

    loadWorkspace();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { currentWorkspace, workspaces, loading };
}
