import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_EXECUTIVE_SUMMARY } from "@/lib/ai/mock-data";
import { z } from "zod";

const requestSchema = z.object({
  projectId: z.string().uuid(),
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

    const { projectId } = parsed.data;

    const supabase = await createClient();

    // Fetch project data in parallel
    const [
      { data: project },
      { data: journeyMaps },
      { data: findings },
      { data: personas },
      { data: painPointNodes },
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("name, description")
        .eq("id", projectId)
        .single(),
      supabase
        .from("journey_maps")
        .select(
          `
          id,
          name,
          description,
          stages (id, label, description, sort_order),
          map_nodes (id, node_type, label, description, sentiment, severity)
        `
        )
        .eq("project_id", projectId),
      supabase
        .from("findings")
        .select("content, finding_type, theme")
        .eq("project_id", projectId)
        .limit(50),
      supabase
        .from("personas")
        .select("name, role, bio, goals, frustrations")
        .eq("project_id", projectId),
      supabase
        .from("map_nodes")
        .select("label, description, severity")
        .eq("node_type", "pain_point")
        .in(
          "journey_map_id",
          (
            await supabase
              .from("journey_maps")
              .select("id")
              .eq("project_id", projectId)
          ).data?.map((jm) => jm.id) ?? []
        ),
    ]);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Build context for Claude
    const contextParts: string[] = [];

    contextParts.push(`Project: ${project.name}`);
    if (project.description) {
      contextParts.push(`Description: ${project.description}`);
    }

    if (journeyMaps && journeyMaps.length > 0) {
      const mapSummaries = journeyMaps.map((jm) => {
        const stages = (jm.stages as Array<{ label: string }>) ?? [];
        const nodes =
          (jm.map_nodes as Array<{ node_type: string; label: string }>) ?? [];
        return `Journey Map "${jm.name}": ${stages.length} stages, ${nodes.length} nodes`;
      });
      contextParts.push(`Journey Maps:\n${mapSummaries.join("\n")}`);
    }

    if (personas && personas.length > 0) {
      const personaSummaries = personas.map(
        (p) => `- ${p.name}${p.role ? ` (${p.role})` : ""}`
      );
      contextParts.push(`Personas:\n${personaSummaries.join("\n")}`);
    }

    if (findings && findings.length > 0) {
      const findingSummaries = findings
        .slice(0, 20)
        .map((f) => `- [${f.finding_type}] ${f.content}`);
      contextParts.push(`Key Findings:\n${findingSummaries.join("\n")}`);
    }

    if (painPointNodes && painPointNodes.length > 0) {
      const painSummaries = painPointNodes.map(
        (p) =>
          `- ${p.label}${p.severity ? ` (${p.severity})` : ""}: ${p.description || ""}`
      );
      contextParts.push(`Pain Points:\n${painSummaries.join("\n")}`);
    }

    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({ summary: MOCK_EXECUTIVE_SUMMARY });
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: `You are a UX research consultant writing an executive summary for a customer journey mapping project. Write a concise, professional executive summary in 2-3 paragraphs. Focus on:
1. The scope and purpose of the journey mapping initiative
2. Key insights and patterns discovered
3. The most critical pain points and highest-impact opportunities

Use a professional but accessible tone. Avoid jargon. Do not use bullet points — write in flowing prose. Do not include headings or labels.`,
      messages: [
        {
          role: "user",
          content: `Write an executive summary based on this project data:\n\n${contextParts.join("\n\n")}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const summary = textBlock?.text || "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      {
        error: "Summarization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
