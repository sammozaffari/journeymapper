"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const { projectId, mapId } = useParams<{
    projectId: string;
    mapId: string;
  }>();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [linkedPersonas, setLinkedPersonas] = useState<Array<{ id: string; name: string; role: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // Track original node/edge IDs for diffing
  const originalNodeIds = useRef<Set<string>>(new Set());
  const originalEdgeIds = useRef<Set<string>>(new Set());

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

      // Load linked personas
      const { data: personaLinks } = await supabase
        .from("persona_journey_links")
        .select("persona_id, personas(id, name, role)")
        .eq("journey_map_id", mapId);

      if (personaLinks) {
        setLinkedPersonas(
          personaLinks
            .map((l: any) => l.personas)
            .filter(Boolean)
        );
      }

      if (mapResult.data) {
        const md = {
          ...mapResult.data,
          stages: stagesResult.data || [],
          lanes: lanesResult.data || [],
          nodes: nodesResult.data || [],
          edges: edgesResult.data || [],
        };
        setMapData(md);
        originalNodeIds.current = new Set(md.nodes.map((n: any) => n.id));
        originalEdgeIds.current = new Set(md.edges.map((e: any) => e.id));
      }
      setLoading(false);
    }

    loadMap();
  }, [mapId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist canvas state to Supabase
  const handleSave = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      if (!mapData) return;

      const currentNodeIds = new Set(nodes.map((n) => n.id));
      const currentEdgeIds = new Set(edges.map((e) => e.id));

      // Upsert nodes (new + updated)
      for (const node of nodes) {
        const nodeData = {
          id: node.id,
          journey_map_id: mapId,
          node_type: node.type || "touchpoint",
          label: (node.data as any).label || "Untitled",
          description: (node.data as any).description || null,
          position_x: node.position.x,
          position_y: node.position.y,
          sentiment: (node.data as any).sentiment || null,
          severity: (node.data as any).severity || null,
          metadata: {},
        };

        if (originalNodeIds.current.has(node.id)) {
          // Update existing
          await supabase
            .from("map_nodes")
            .update({
              label: nodeData.label,
              description: nodeData.description,
              position_x: nodeData.position_x,
              position_y: nodeData.position_y,
              sentiment: nodeData.sentiment,
              severity: nodeData.severity,
            })
            .eq("id", node.id);
        } else {
          // Insert new
          await supabase.from("map_nodes").insert(nodeData);
          originalNodeIds.current.add(node.id);
        }
      }

      // Delete removed nodes
      for (const id of originalNodeIds.current) {
        if (!currentNodeIds.has(id)) {
          await supabase.from("map_nodes").delete().eq("id", id);
          originalNodeIds.current.delete(id);
        }
      }

      // Upsert edges
      for (const edge of edges) {
        if (!originalEdgeIds.current.has(edge.id)) {
          await supabase.from("map_edges").insert({
            id: edge.id,
            journey_map_id: mapId,
            source_node_id: edge.source,
            target_node_id: edge.target,
            edge_type: "flow",
            animated: edge.animated || false,
            label: (edge.label as string) || null,
          });
          originalEdgeIds.current.add(edge.id);
        }
      }

      // Delete removed edges
      for (const id of originalEdgeIds.current) {
        if (!currentEdgeIds.has(id)) {
          await supabase.from("map_edges").delete().eq("id", id);
          originalEdgeIds.current.delete(id);
        }
      }

      console.log("Canvas saved", {
        nodes: nodes.length,
        edges: edges.length,
      });
    },
    [mapData, mapId, supabase]
  );

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
        {linkedPersonas.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[10px] text-muted-foreground/40">Personas:</span>
            {linkedPersonas.map((p) => (
              <span
                key={p.id}
                className="text-[10px] bg-rose-400/10 text-rose-400 px-1.5 py-0.5 rounded"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <JourneyCanvas
        stages={mapData.stages}
        lanes={mapData.lanes}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onSave={handleSave}
      />
    </div>
  );
}
