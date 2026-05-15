"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface JourneyMap {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  mode: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function useJourneyMaps(projectId: string) {
  const [maps, setMaps] = useState<JourneyMap[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadMaps() {
      setLoading(true);
      const { data } = await supabase
        .from("journey_maps")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });

      if (data) setMaps(data);
      setLoading(false);
    }
    loadMaps();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMap = useCallback(
    async (name: string, description?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: map, error } = await supabase
        .from("journey_maps")
        .insert({
          project_id: projectId,
          name,
          description: description || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (map) {
        // Create default stages
        const defaults = await import("@/lib/canvas/defaults");
        const stageInserts = defaults.DEFAULT_STAGES.map((s) => ({
          journey_map_id: map.id,
          ...s,
        }));
        await supabase.from("stages").insert(stageInserts);

        // Create default lanes
        const laneInserts = defaults.DEFAULT_LANES.map((l) => ({
          journey_map_id: map.id,
          ...l,
        }));
        await supabase.from("lanes").insert(laneInserts);

        setMaps((prev) => [map, ...prev]);
        return map;
      }
      return null;
    },
    [projectId, supabase]
  );

  const deleteMap = useCallback(
    async (mapId: string) => {
      await supabase.from("journey_maps").delete().eq("id", mapId);
      setMaps((prev) => prev.filter((m) => m.id !== mapId));
    },
    [supabase]
  );

  return { maps, loading, createMap, deleteMap };
}
