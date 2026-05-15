"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JourneyCanvas } from "@/components/canvas/JourneyCanvas";
import { Skeleton } from "@/components/ui/skeleton";
import type { Node, Edge } from "@xyflow/react";

interface MapData {
  id: string;
  name: string;
  mode: string;
  stages: Array<{
    id: string;
    label: string;
    sort_order: number;
    color: string;
  }>;
  lanes: Array<{
    id: string;
    lane_type: string;
    label: string;
    sort_order: number;
    color: string;
  }>;
  nodes: Array<{
    id: string;
    node_type: string;
    label: string;
    description: string | null;
    position_x: number;
    position_y: number;
    sentiment: number | null;
    severity: string | null;
    metadata: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    edge_type: string;
    label: string | null;
    animated: boolean;
  }>;
}

export default function MapCanvasPage() {
  const { mapId } = useParams<{ projectId: string; mapId: string }>();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadMap() {
      setLoading(true);

      const [mapResult, stagesResult, lanesResult, nodesResult, edgesResult] =
        await Promise.all([
          supabase.from("journey_maps").select("*").eq("id", mapId).single(),
          supabase
            .from("stages")
            .select("*")
            .eq("journey_map_id", mapId)
            .order("sort_order"),
          supabase
            .from("lanes")
            .select("*")
            .eq("journey_map_id", mapId)
            .order("sort_order"),
          supabase
            .from("map_nodes")
            .select("*")
            .eq("journey_map_id", mapId),
          supabase
            .from("map_edges")
            .select("*")
            .eq("journey_map_id", mapId),
        ]);

      if (mapResult.data) {
        setMapData({
          ...mapResult.data,
          stages: stagesResult.data || [],
          lanes: lanesResult.data || [],
          nodes: nodesResult.data || [],
          edges: edgesResult.data || [],
        });
      }
      setLoading(false);
    }

    loadMap();
  }, [mapId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Map not found</p>
      </div>
    );
  }

  // Convert DB nodes to React Flow nodes
  const initialNodes: Node[] = mapData.nodes.map((n) => ({
    id: n.id,
    type: n.node_type,
    position: { x: n.position_x, y: n.position_y },
    data: {
      label: n.label,
      description: n.description || "",
      sentiment: n.sentiment,
      severity: n.severity,
      ...n.metadata,
    },
  }));

  // Convert DB edges to React Flow edges
  const initialEdges: Edge[] = mapData.edges.map((e) => ({
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    type: "smoothstep",
    animated: e.animated,
    label: e.label || undefined,
  }));

  return (
    <div className="flex-1 flex flex-col">
      {/* Map header bar */}
      <div className="h-10 border-b border-border/30 bg-card/50 flex items-center px-4 gap-3 shrink-0">
        <h2 className="text-sm font-medium">{mapData.name}</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded">
          {mapData.mode}
        </span>
      </div>

      {/* Canvas */}
      <JourneyCanvas
        stages={mapData.stages}
        lanes={mapData.lanes}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />
    </div>
  );
}
