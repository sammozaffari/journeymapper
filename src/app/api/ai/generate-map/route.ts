import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { MAP_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { mapGenerationSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  context: z.string().min(1),
  journeyMapId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, context, journeyMapId } = parsed.data;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: MAP_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Based on the following context, generate a complete journey map structure with stages, nodes, and connections. Return a JSON object.\n\n${context}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    const rawParsed = JSON.parse(text);
    const mapData = mapGenerationSchema.parse(rawParsed);

    const supabase = await createClient();
    let mapId = journeyMapId;

    if (journeyMapId) {
      // Add to existing map -- fetch current data to determine offsets
      const { data: existingMap } = await supabase
        .from("journey_maps")
        .select("id")
        .eq("id", journeyMapId)
        .single();

      if (!existingMap) {
        return NextResponse.json(
          { error: "Journey map not found" },
          { status: 404 }
        );
      }

      // Get the current max stage order
      const { data: existingStages } = await supabase
        .from("stages")
        .select("id, order_index")
        .eq("journey_map_id", journeyMapId)
        .order("order_index", { ascending: false })
        .limit(1);

      const stageOffset = existingStages?.[0]?.order_index ?? -1;

      // Insert new stages
      const stagesToInsert = mapData.stages.map((stage, i) => ({
        journey_map_id: journeyMapId,
        label: stage.label,
        description: stage.description,
        order_index: stageOffset + 1 + i,
      }));

      const { data: insertedStages, error: stagesError } = await supabase
        .from("stages")
        .insert(stagesToInsert)
        .select();

      if (stagesError || !insertedStages) {
        return NextResponse.json(
          { error: "Failed to create stages", message: stagesError?.message },
          { status: 500 }
        );
      }

      // Insert nodes
      const nodesToInsert = mapData.nodes.map((node) => ({
        journey_map_id: journeyMapId,
        stage_id: insertedStages[node.stage_index]?.id,
        type: node.type,
        label: node.label,
        description: node.description,
        lane: node.lane,
        sentiment: node.sentiment,
        severity: node.severity,
      }));

      const { data: insertedNodes, error: nodesError } = await supabase
        .from("nodes")
        .insert(nodesToInsert)
        .select();

      if (nodesError || !insertedNodes) {
        return NextResponse.json(
          { error: "Failed to create nodes", message: nodesError?.message },
          { status: 500 }
        );
      }

      // Insert edges
      const edgesToInsert = mapData.connections.map((conn) => ({
        journey_map_id: journeyMapId,
        source_node_id: insertedNodes[conn.from_index]?.id,
        target_node_id: insertedNodes[conn.to_index]?.id,
        type: conn.type,
      }));

      const { error: edgesError } = await supabase
        .from("edges")
        .insert(edgesToInsert);

      if (edgesError) {
        return NextResponse.json(
          { error: "Failed to create edges", message: edgesError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          journey_map_id: journeyMapId,
          stages: insertedStages,
          nodes: insertedNodes,
          connections: edgesToInsert,
        },
      });
    } else {
      // Create a new journey map
      const { data: newMap, error: mapError } = await supabase
        .from("journey_maps")
        .insert({
          project_id: projectId,
          title: "AI-Generated Journey Map",
        })
        .select()
        .single();

      if (mapError || !newMap) {
        return NextResponse.json(
          { error: "Failed to create journey map", message: mapError?.message },
          { status: 500 }
        );
      }

      mapId = newMap.id;

      // Insert stages
      const stagesToInsert = mapData.stages.map((stage, i) => ({
        journey_map_id: mapId,
        label: stage.label,
        description: stage.description,
        order_index: i,
      }));

      const { data: insertedStages, error: stagesError } = await supabase
        .from("stages")
        .insert(stagesToInsert)
        .select();

      if (stagesError || !insertedStages) {
        return NextResponse.json(
          { error: "Failed to create stages", message: stagesError?.message },
          { status: 500 }
        );
      }

      // Insert nodes
      const nodesToInsert = mapData.nodes.map((node) => ({
        journey_map_id: mapId,
        stage_id: insertedStages[node.stage_index]?.id,
        type: node.type,
        label: node.label,
        description: node.description,
        lane: node.lane,
        sentiment: node.sentiment,
        severity: node.severity,
      }));

      const { data: insertedNodes, error: nodesError } = await supabase
        .from("nodes")
        .insert(nodesToInsert)
        .select();

      if (nodesError || !insertedNodes) {
        return NextResponse.json(
          { error: "Failed to create nodes", message: nodesError?.message },
          { status: 500 }
        );
      }

      // Insert edges
      const edgesToInsert = mapData.connections.map((conn) => ({
        journey_map_id: mapId,
        source_node_id: insertedNodes[conn.from_index]?.id,
        target_node_id: insertedNodes[conn.to_index]?.id,
        type: conn.type,
      }));

      const { error: edgesError } = await supabase
        .from("edges")
        .insert(edgesToInsert);

      if (edgesError) {
        return NextResponse.json(
          { error: "Failed to create edges", message: edgesError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          journey_map_id: mapId,
          map: newMap,
          stages: insertedStages,
          nodes: insertedNodes,
          connections: edgesToInsert,
        },
      });
    }
  } catch (error) {
    console.error("Map generation error:", error);
    return NextResponse.json(
      { error: "Map generation failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
