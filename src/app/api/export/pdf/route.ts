import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_EXECUTIVE_SUMMARY } from "@/lib/ai/mock-data";
import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── HTML Generator ─────────────────────────────────────────────────────

function generateHTMLReport(data: {
  projectName: string;
  projectDescription?: string;
  executiveSummary?: string;
  stages: Array<{ label: string; description?: string }>;
  nodes: Array<{
    type: string;
    label: string;
    description?: string;
    stage_index: number;
    lane: string;
  }>;
  personas: Array<{
    name: string;
    role?: string;
    bio?: string;
    goals: string[];
    frustrations: string[];
  }>;
  painPoints: string[];
  opportunities: string[];
  findings: Array<{ content: string; type: string }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    effort: string;
    status: string;
  }>;
}): string {
  const accent = "#5E6AD2";
  const date = formatDate();

  // Build sections
  const sections: string[] = [];

  // Title page
  sections.push(`
    <div class="title-page">
      <div class="title-accent"></div>
      <h1>${escapeHtml(data.projectName)}</h1>
      ${data.projectDescription ? `<p class="subtitle">${escapeHtml(data.projectDescription)}</p>` : ""}
      <p class="date">${date}</p>
      <p class="branding">Created with JourneyMapper</p>
    </div>
  `);

  // Executive summary
  if (data.executiveSummary) {
    sections.push(`
      <div class="section page-break">
        <h2>Executive Summary</h2>
        <div class="summary-block">
          ${data.executiveSummary.split("\n\n").map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        </div>
      </div>
    `);
  }

  // Problem statement (from project description)
  if (data.projectDescription) {
    sections.push(`
      <div class="section">
        <h2>Problem Statement</h2>
        <div class="card">
          <p>${escapeHtml(data.projectDescription)}</p>
        </div>
      </div>
    `);
  }

  // Personas
  if (data.personas.length > 0) {
    const personaCards = data.personas
      .map(
        (p) => `
        <div class="card persona-card">
          <h4>${escapeHtml(p.name)}</h4>
          ${p.role ? `<p class="role">${escapeHtml(p.role)}</p>` : ""}
          ${p.bio ? `<p class="bio">${escapeHtml(p.bio)}</p>` : ""}
          ${
            p.goals.length > 0
              ? `<div class="persona-section">
                  <h5 class="green">Goals</h5>
                  <ul>${p.goals.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
                </div>`
              : ""
          }
          ${
            p.frustrations.length > 0
              ? `<div class="persona-section">
                  <h5 class="red">Frustrations</h5>
                  <ul>${p.frustrations.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
                </div>`
              : ""
          }
        </div>
      `
      )
      .join("");

    sections.push(`
      <div class="section page-break">
        <h2>Personas</h2>
        <div class="card-grid">${personaCards}</div>
      </div>
    `);
  }

  // Blueprint overview
  if (data.stages.length > 0) {
    const stageBlocks = data.stages
      .map((stage, idx) => {
        const stageNodes = data.nodes.filter((n) => n.stage_index === idx);
        const nodeList =
          stageNodes.length > 0
            ? `<ul>${stageNodes.map((n) => `<li><span class="node-type">${escapeHtml(n.type.replace(/_/g, " "))}</span> ${escapeHtml(n.label)}</li>`).join("")}</ul>`
            : `<p class="muted">No nodes</p>`;

        return `
          <div class="stage-block">
            <div class="stage-header">
              <span class="stage-num">${idx + 1}</span>
              <span class="stage-label">${escapeHtml(stage.label)}</span>
            </div>
            ${stage.description ? `<p class="stage-desc">${escapeHtml(stage.description)}</p>` : ""}
            ${nodeList}
          </div>
        `;
      })
      .join("");

    sections.push(`
      <div class="section page-break">
        <h2>Blueprint Overview</h2>
        <div class="stages-grid">${stageBlocks}</div>
      </div>
    `);
  }

  // Key findings
  if (data.findings.length > 0) {
    const findingItems = data.findings
      .map(
        (f) =>
          `<li><span class="finding-type type-${f.type}">${escapeHtml(f.type.replace(/_/g, " ").toUpperCase())}</span> ${escapeHtml(f.content)}</li>`
      )
      .join("");

    sections.push(`
      <div class="section page-break">
        <h2>Key Findings</h2>
        <ul class="findings-list">${findingItems}</ul>
      </div>
    `);
  }

  // Pain points & opportunities
  if (data.painPoints.length > 0 || data.opportunities.length > 0) {
    sections.push(`
      <div class="section page-break">
        <h2>Pain Points &amp; Opportunities</h2>
        <div class="two-col">
          <div>
            <h3 class="red">Pain Points</h3>
            ${data.painPoints.length > 0 ? `<ul class="pain-list">${data.painPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : `<p class="muted">None identified</p>`}
          </div>
          <div>
            <h3 class="green">Opportunities</h3>
            ${data.opportunities.length > 0 ? `<ul class="opp-list">${data.opportunities.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>` : `<p class="muted">None identified</p>`}
          </div>
        </div>
      </div>
    `);
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    const rows = data.recommendations
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.title)}</td>
          <td class="level-${r.impact}">${escapeHtml(r.impact)}</td>
          <td class="level-${r.effort}">${escapeHtml(r.effort)}</td>
          <td>${escapeHtml(r.status.replace(/_/g, " "))}</td>
        </tr>
      `
      )
      .join("");

    sections.push(`
      <div class="section page-break">
        <h2>Recommendations</h2>
        <table class="rec-table">
          <thead>
            <tr>
              <th>Recommendation</th>
              <th>Impact</th>
              <th>Effort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  }

  // Footer
  sections.push(`
    <div class="footer-section">
      <p>Created with JourneyMapper &middot; ${date}</p>
    </div>
  `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.projectName)} - Report</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #08090a;
      color: #e8e8e8;
      line-height: 1.6;
      padding: 0;
    }

    /* ── Print button ── */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${accent};
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
    }
    .print-bar span { color: white; font-size: 14px; font-weight: 500; }
    .print-btn {
      background: white;
      color: ${accent};
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-btn:hover { opacity: 0.9; }

    /* ── Container ── */
    .container {
      max-width: 900px;
      margin: 60px auto 40px;
      padding: 0 24px;
    }

    /* ── Title page ── */
    .title-page {
      padding: 80px 0 60px;
      border-bottom: 2px solid ${accent};
      margin-bottom: 40px;
    }
    .title-accent {
      width: 60px;
      height: 4px;
      background: ${accent};
      margin-bottom: 24px;
    }
    .title-page h1 {
      font-size: 36px;
      font-weight: 700;
      color: white;
      margin-bottom: 12px;
    }
    .title-page .subtitle {
      font-size: 16px;
      color: #a0a0a0;
      margin-bottom: 20px;
    }
    .title-page .date {
      font-size: 14px;
      color: #707070;
    }
    .title-page .branding {
      font-size: 12px;
      color: ${accent};
      font-style: italic;
      margin-top: 40px;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 48px;
    }
    .section h2 {
      font-size: 24px;
      font-weight: 600;
      color: ${accent};
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1a1a2e;
    }
    .section h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .section h3.red { color: #E57373; }
    .section h3.green { color: #81C784; }

    /* ── Cards ── */
    .card {
      background: #12131a;
      border: 1px solid #1e1f2e;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card p { color: #c0c0c0; font-size: 14px; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 16px;
    }

    /* ── Personas ── */
    .persona-card h4 {
      font-size: 18px;
      color: white;
      margin-bottom: 4px;
    }
    .persona-card .role {
      color: ${accent};
      font-size: 13px;
      margin-bottom: 8px;
    }
    .persona-card .bio {
      font-style: italic;
      margin-bottom: 12px;
    }
    .persona-section { margin-top: 12px; }
    .persona-section h5 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .persona-section h5.green { color: #81C784; }
    .persona-section h5.red { color: #E57373; }
    .persona-section ul {
      list-style: none;
      padding: 0;
    }
    .persona-section ul li {
      font-size: 13px;
      color: #c0c0c0;
      padding: 3px 0 3px 16px;
      position: relative;
    }
    .persona-section ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #555;
    }

    /* ── Summary ── */
    .summary-block {
      border-left: 3px solid ${accent};
      padding-left: 20px;
    }
    .summary-block p {
      color: #d0d0d0;
      font-size: 15px;
      margin-bottom: 16px;
      line-height: 1.7;
    }

    /* ── Stages ── */
    .stages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .stage-block {
      background: #12131a;
      border: 1px solid #1e1f2e;
      border-radius: 8px;
      padding: 16px;
    }
    .stage-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .stage-num {
      background: ${accent};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .stage-label {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    .stage-desc {
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
    }
    .stage-block ul {
      list-style: none;
      padding: 0;
    }
    .stage-block ul li {
      font-size: 12px;
      color: #c0c0c0;
      padding: 3px 0;
    }
    .node-type {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: ${accent};
      margin-right: 4px;
    }
    .muted { color: #555; font-size: 13px; font-style: italic; }

    /* ── Findings ── */
    .findings-list {
      list-style: none;
      padding: 0;
    }
    .findings-list li {
      padding: 10px 16px;
      background: #12131a;
      border: 1px solid #1e1f2e;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #d0d0d0;
    }
    .finding-type {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 8px;
      background: #1e1f2e;
      color: ${accent};
    }
    .type-pain_point { color: #E57373; }
    .type-opportunity { color: #81C784; }

    /* ── Two column layout ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .pain-list, .opp-list {
      list-style: none;
      padding: 0;
    }
    .pain-list li, .opp-list li {
      font-size: 13px;
      color: #c0c0c0;
      padding: 6px 0 6px 20px;
      position: relative;
    }
    .pain-list li::before {
      content: '\\26A0';
      position: absolute;
      left: 0;
      color: #E57373;
    }
    .opp-list li::before {
      content: '\\2728';
      position: absolute;
      left: 0;
      color: #81C784;
    }

    /* ── Recommendations table ── */
    .rec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .rec-table th {
      background: ${accent};
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    .rec-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #1e1f2e;
      color: #c0c0c0;
    }
    .rec-table tr:nth-child(even) td { background: #0d0e14; }
    .level-high { color: #E57373 !important; font-weight: 600; }
    .level-medium { color: #FFB74D !important; font-weight: 600; }
    .level-low { color: #81C784 !important; font-weight: 600; }

    /* ── Footer ── */
    .footer-section {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #1e1f2e;
      text-align: center;
    }
    .footer-section p {
      font-size: 12px;
      color: #555;
    }

    /* ── Print styles ── */
    @media print {
      body {
        background: white;
        color: #1a1a1a;
        padding: 0;
        font-size: 11pt;
      }
      .print-bar { display: none !important; }
      .container { margin: 0; padding: 0 20px; max-width: 100%; }
      .title-page {
        padding: 40px 0 30px;
        border-bottom-color: ${accent};
      }
      .title-page h1 { color: #1a1a1a; font-size: 28pt; }
      .title-page .subtitle { color: #555; }
      .title-page .date { color: #777; }
      .title-page .branding { color: ${accent}; }

      .section h2 { color: ${accent}; border-bottom-color: #ddd; }
      .card {
        background: #f8f8f8;
        border-color: #ddd;
      }
      .card p, .findings-list li, .pain-list li, .opp-list li,
      .rec-table td, .persona-section ul li, .summary-block p,
      .stage-block ul li { color: #333; }
      .stage-block { background: #f8f8f8; border-color: #ddd; }
      .findings-list li { background: #f8f8f8; border-color: #ddd; }
      .finding-type { background: #eee; }
      .rec-table td { border-bottom-color: #ddd; }
      .rec-table tr:nth-child(even) td { background: #f5f5f5; }
      .persona-card h4 { color: #1a1a1a; }
      .stage-label { color: #1a1a1a; }

      .page-break { page-break-before: always; }

      .footer-section { border-top-color: #ddd; }
      .footer-section p { color: #999; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>${escapeHtml(data.projectName)} - Report</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="container">
    ${sections.join("\n")}
  </div>
</body>
</html>`;
}

// ── Validation ────────────────────────────────────────────────────────

const requestSchema = z.object({
  projectId: z.string().uuid(),
});

// ── Route handler ──────────────────────────────────────────────────────

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
    }));

    const painPoints = allRawNodes
      .filter((n) => n.node_type === "pain_point")
      .map(
        (n) =>
          `${n.label}${n.description ? ": " + n.description : ""}${n.severity ? ` (${n.severity})` : ""}`
      );

    const opportunities = allRawNodes
      .filter((n) => n.node_type === "opportunity")
      .map((n) => `${n.label}${n.description ? ": " + n.description : ""}`);

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

    // Generate executive summary
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
        console.error("Failed to generate executive summary:", summaryError);
      }
    }

    const reportData = {
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
      })),
      painPoints: allPainPoints,
      opportunities: allOpportunities,
      findings: exportFindings,
      recommendations: (recommendations ?? []).map((r) => ({
        title: r.title,
        description: r.description,
        impact: r.impact ?? "medium",
        effort: r.effort ?? "medium",
        status: r.status ?? "proposed",
      })),
    };

    const html = generateHTMLReport(reportData);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
