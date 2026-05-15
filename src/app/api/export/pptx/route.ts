import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { generatePPTX, type ExportData } from "@/lib/export/pptx-generator";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_EXECUTIVE_SUMMARY } from "@/lib/ai/mock-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch all project data in parallel
    const [
      { data: project, error: projectError },
      { data: journeyMaps },
      { data: personas },
      { data: findings },
      { data: recommendations },
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, description")
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
          map_nodes (id, node_type, label, description, stage_id, lane_id, sentiment, severity)
        `
        )
        .eq("project_id", projectId),
      supabase
        .from("personas")
        .select("name, role, bio, goals, frustrations, quotes")
        .eq("project_id", projectId),
      supabase
        .from("findings")
        .select("content, finding_type")
        .eq("project_id", projectId),
      supabase
        .from("recommendations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at"),
    ]);

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Build stage list and node list from all journey maps
    // Use the first journey map's stages as the primary view
    const primaryMap = journeyMaps?.[0];
    const rawStages = (
      (primaryMap?.stages as Array<{
        id: string;
        label: string;
        description?: string;
        sort_order: number;
      }>) ?? []
    ).sort((a, b) => a.sort_order - b.sort_order);

    const stageIdToIndex = new Map<string, number>();
    rawStages.forEach((s, i) => stageIdToIndex.set(s.id, i));

    const stages = rawStages.map((s) => ({
      label: s.label,
      description: s.description,
    }));

    // Collect all nodes across maps, mapping stage_id to stage_index
    const allRawNodes =
      (journeyMaps ?? []).flatMap(
        (jm) =>
          (jm.map_nodes as Array<{
            id: string;
            node_type: string;
            label: string;
            description?: string;
            stage_id?: string;
            lane_id?: string;
            sentiment?: number;
            severity?: string;
          }>) ?? []
      );

    const nodes = allRawNodes.map((n) => ({
      type: n.node_type,
      label: n.label,
      description: n.description,
      stage_index: n.stage_id ? (stageIdToIndex.get(n.stage_id) ?? 0) : 0,
      lane: n.lane_id ?? "default",
      sentiment: n.sentiment,
      severity: n.severity,
    }));

    // Extract pain points and opportunities from nodes
    const painPoints = allRawNodes
      .filter((n) => n.node_type === "pain_point")
      .map(
        (n) =>
          `${n.label}${n.description ? ": " + n.description : ""}${n.severity ? ` (${n.severity})` : ""}`
      );

    const opportunities = allRawNodes
      .filter((n) => n.node_type === "opportunity")
      .map(
        (n) => `${n.label}${n.description ? ": " + n.description : ""}`
      );

    // Also pull pain points and opportunities from findings
    const findingPainPoints = (findings ?? [])
      .filter((f) => f.finding_type === "pain_point")
      .map((f) => f.content);

    const findingOpportunities = (findings ?? [])
      .filter((f) => f.finding_type === "opportunity")
      .map((f) => f.content);

    const allPainPoints = [...painPoints, ...findingPainPoints];
    const allOpportunities = [...opportunities, ...findingOpportunities];

    const exportFindings = (findings ?? [])
      .filter(
        (f) =>
          f.finding_type !== "pain_point" && f.finding_type !== "opportunity"
      )
      .map((f) => ({
        content: f.content,
        type: f.finding_type ?? "insight",
      }));

    // Generate executive summary via Claude
    let executiveSummary: string | undefined;
    if (isMockMode()) {
      executiveSummary = MOCK_EXECUTIVE_SUMMARY;
    } else {
      try {
        const client = getAnthropicClient();

        const contextParts: string[] = [
          `Project: ${project.name}`,
          project.description ? `Description: ${project.description}` : "",
          `Stages: ${stages.map((s) => s.label).join(" → ")}`,
          `${nodes.length} touchpoints/nodes mapped`,
          `${allPainPoints.length} pain points identified`,
          `${allOpportunities.length} opportunities identified`,
          `${(personas ?? []).length} personas created`,
          `${(findings ?? []).length} research findings`,
        ].filter(Boolean);

        if (allPainPoints.length > 0) {
          contextParts.push(
            `Top pain points:\n${allPainPoints.slice(0, 5).map((p) => `- ${p}`).join("\n")}`
          );
        }

        if ((personas ?? []).length > 0) {
          contextParts.push(
            `Personas: ${(personas ?? []).map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}`).join(", ")}`
          );
        }

        const response = await client.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          system: `You are a UX research consultant. Write a concise executive summary (2-3 paragraphs) for a journey mapping project export. Be professional, insightful, and action-oriented. Write in flowing prose, no bullet points or headings.`,
          messages: [
            {
              role: "user",
              content: `Write an executive summary:\n\n${contextParts.join("\n")}`,
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        executiveSummary = textBlock?.text;
      } catch (summaryError) {
        // Non-fatal: proceed without executive summary
        console.error("Failed to generate executive summary:", summaryError);
      }
    }

    // Assemble export data
    const exportData: ExportData = {
      projectName: project.name,
      projectDescription: project.description ?? undefined,
      executiveSummary,
      stages,
      nodes,
      personas: (personas ?? []).map((p) => ({
        name: p.name,
        role: p.role ?? undefined,
        bio: p.bio ?? undefined,
        goals: (p.goals as string[]) ?? [],
        frustrations: (p.frustrations as string[]) ?? [],
        quotes: (p.quotes as string[]) ?? [],
      })),
      painPoints: allPainPoints,
      opportunities: allOpportunities,
      findings: exportFindings,
      recommendations: (recommendations ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        impact: r.impact ?? "medium",
        effort: r.effort ?? "medium",
        status: r.status ?? "proposed",
        solution_type: r.solution_type ?? "process_change",
      })),
    };

    // Generate PPTX
    const pptxBuffer = await generatePPTX(exportData);

    // Sanitize filename
    const safeName = project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new Response(pptxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeName}-export.pptx"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PPTX export error:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
