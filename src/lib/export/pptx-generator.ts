import PptxGenJS from "pptxgenjs";

// ── Types ──────────────────────────────────────────────────────────────

export interface ExportData {
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
    sentiment?: number;
    severity?: string;
  }>;
  personas: Array<{
    name: string;
    role?: string;
    bio?: string;
    goals: string[];
    frustrations: string[];
    quotes: string[];
  }>;
  painPoints: string[];
  opportunities: string[];
  findings: Array<{
    content: string;
    type: string;
  }>;
  recommendations?: Array<{
    id: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
    status: string;
    solution_type: string;
  }>;
  branding?: {
    clientName?: string;
    clientLogo?: string; // base64 or URL
    accentColor?: string; // hex (without #)
  };
}

// ── Design tokens ──────────────────────────────────────────────────────

const DEFAULT_COLORS = {
  bg: "1A1816",
  text: "F0ECE6",
  textMuted: "A8A29E",
  brand: "5E6AD2",
  red: "E57373",
  amber: "FFB74D",
  green: "81C784",
  white: "FFFFFF",
  cardBg: "252220",
  divider: "3A3634",
} as const;

let COLORS: Record<keyof typeof DEFAULT_COLORS, string> = { ...DEFAULT_COLORS };

const FONT = "Calibri";

/** Track slide numbers (reset per generation) */
let slideCounter = 0;

// ── Helpers ────────────────────────────────────────────────────────────

function addBottomBar(slide: PptxGenJS.Slide) {
  slide.addShape("rect", {
    x: 0,
    y: 7.35,
    w: "100%",
    h: 0.15,
    fill: { color: COLORS.brand },
  });
}

/** Add header bar + project name + slide number (for non-title slides) */
function addSlideChrome(slide: PptxGenJS.Slide, projectName: string) {
  slideCounter++;

  // Thin accent line at top
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.03,
    fill: { color: COLORS.brand },
  });

  // Project name top-left
  slide.addText(projectName, {
    x: 0.3,
    y: 0.06,
    w: 4,
    h: 0.25,
    fontSize: 9,
    color: COLORS.textMuted,
    fontFace: FONT,
  });

  // Slide number bottom-right
  slide.addText(`${slideCounter}`, {
    x: 8.8,
    y: 7.05,
    w: 0.6,
    h: 0.25,
    fontSize: 9,
    color: COLORS.textMuted,
    fontFace: FONT,
    align: "right",
  });
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string) {
  slide.addText(title, {
    x: 0.6,
    y: 0.3,
    w: 8.8,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: COLORS.brand,
    fontFace: FONT,
  });

  // Accent line under title
  slide.addShape("rect", {
    x: 0.6,
    y: 0.95,
    w: 1.5,
    h: 0.04,
    fill: { color: COLORS.brand },
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

// ── Slide builders ─────────────────────────────────────────────────────

function buildTitleSlide(pptx: PptxGenJS, data: ExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  // Decorative amber bar left
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.12,
    h: "100%",
    fill: { color: COLORS.brand },
  });

  slide.addText(data.projectName, {
    x: 0.8,
    y: 1.8,
    w: 8.4,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: COLORS.text,
    fontFace: FONT,
  });

  if (data.projectDescription) {
    slide.addText(data.projectDescription, {
      x: 0.8,
      y: 3.1,
      w: 8.4,
      h: 0.8,
      fontSize: 16,
      color: COLORS.textMuted,
      fontFace: FONT,
    });
  }

  slide.addText(formatDate(), {
    x: 0.8,
    y: 4.2,
    w: 4,
    h: 0.5,
    fontSize: 12,
    color: COLORS.textMuted,
    fontFace: FONT,
  });

  // Client name if provided
  if (data.branding?.clientName) {
    slide.addText(`Prepared for ${data.branding.clientName}`, {
      x: 0.8,
      y: 4.8,
      w: 4,
      h: 0.4,
      fontSize: 13,
      color: COLORS.text,
      fontFace: FONT,
    });
  }

  slide.addText("Created with JourneyMapper", {
    x: 0.8,
    y: 6.4,
    w: 4,
    h: 0.4,
    fontSize: 11,
    color: COLORS.brand,
    fontFace: FONT,
    italic: true,
  });

  addBottomBar(slide);
}

function buildExecutiveSummarySlide(pptx: PptxGenJS, summary: string, projectName: string) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, projectName);

  addSlideTitle(slide, "Executive Summary");

  // Amber accent bar beside text
  slide.addShape("rect", {
    x: 0.6,
    y: 1.3,
    w: 0.06,
    h: 4.5,
    fill: { color: COLORS.brand },
  });

  slide.addText(summary, {
    x: 0.9,
    y: 1.3,
    w: 8.5,
    h: 4.5,
    fontSize: 14,
    color: COLORS.text,
    fontFace: FONT,
    lineSpacingMultiple: 1.4,
    valign: "top",
  });

  addBottomBar(slide);
}

function buildBlueprintOverviewSlide(pptx: PptxGenJS, data: ExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, data.projectName);

  addSlideTitle(slide, "Blueprint Overview");

  const stageCount = data.stages.length;
  if (stageCount === 0) {
    slide.addText("No stages defined.", {
      x: 0.6,
      y: 2.5,
      w: 8.8,
      h: 0.5,
      fontSize: 14,
      color: COLORS.textMuted,
      fontFace: FONT,
    });
    addBottomBar(slide);
    return;
  }

  // Blueprint lanes
  const LANES = [
    { id: "physical_evidence", label: "Physical Evidence" },
    { id: "customer_actions", label: "Customer Actions" },
    { id: "frontstage", label: "Frontstage" },
    { id: "backstage", label: "Backstage" },
    { id: "support_processes", label: "Support Processes" },
  ];

  // Lines of visibility drawn AFTER these lane indices
  const VISIBILITY_LINES = [
    { afterIndex: 1, label: "Line of Interaction" },
    { afterIndex: 2, label: "Line of Visibility" },
    { afterIndex: 3, label: "Line of Internal Interaction" },
  ];

  const maxStages = Math.min(stageCount, 8);
  const labelColWidth = 1.6;
  const tableStartX = 0.6;
  const tableStartY = 1.4;
  const totalTableWidth = 8.8;
  const stageColWidth = (totalTableWidth - labelColWidth) / maxStages;
  const rowHeight = 0.8;
  const totalHeight = LANES.length * rowHeight;

  // Stage headers
  for (let i = 0; i < maxStages; i++) {
    const x = tableStartX + labelColWidth + i * stageColWidth;
    slide.addShape("roundRect", {
      x: x + 0.03,
      y: tableStartY,
      w: stageColWidth - 0.06,
      h: 0.45,
      fill: { color: COLORS.brand },
      rectRadius: 0.06,
    });
    slide.addText(truncate(data.stages[i].label, 18), {
      x: x + 0.03,
      y: tableStartY,
      w: stageColWidth - 0.06,
      h: 0.45,
      fontSize: 8,
      color: COLORS.white,
      fontFace: FONT,
      align: "center",
      valign: "middle",
      bold: true,
    });
  }

  const gridStartY = tableStartY + 0.55;

  // Lane rows
  for (let laneIdx = 0; laneIdx < LANES.length; laneIdx++) {
    const lane = LANES[laneIdx];
    const y = gridStartY + laneIdx * rowHeight;

    // Lane label
    slide.addText(lane.label, {
      x: tableStartX,
      y,
      w: labelColWidth - 0.1,
      h: rowHeight,
      fontSize: 8,
      color: COLORS.textMuted,
      fontFace: FONT,
      bold: true,
      valign: "middle",
    });

    // Cell for each stage
    for (let stageIdx = 0; stageIdx < maxStages; stageIdx++) {
      const x = tableStartX + labelColWidth + stageIdx * stageColWidth;

      // Cell background
      slide.addShape("rect", {
        x: x + 0.02,
        y: y + 0.02,
        w: stageColWidth - 0.04,
        h: rowHeight - 0.04,
        fill: { color: COLORS.cardBg },
        line: { color: COLORS.divider, width: 0.5 },
      });

      // Count nodes matching this lane and stage
      const matchingNodes = data.nodes.filter((n) => {
        const laneMatch =
          n.lane === lane.id ||
          n.lane.toLowerCase().replace(/\s+/g, "_") === lane.id;
        return n.stage_index === stageIdx && laneMatch;
      });

      if (matchingNodes.length > 0) {
        slide.addText(`${matchingNodes.length}`, {
          x: x + 0.02,
          y: y + 0.02,
          w: stageColWidth - 0.04,
          h: rowHeight - 0.04,
          fontSize: 14,
          color: COLORS.brand,
          fontFace: FONT,
          align: "center",
          valign: "middle",
          bold: true,
        });
      }
    }
  }

  // Lines of visibility (dashed lines)
  for (const line of VISIBILITY_LINES) {
    const y = gridStartY + (line.afterIndex + 1) * rowHeight;

    // Dashed line effect using short segments
    const lineStartX = tableStartX + labelColWidth;
    const lineWidth = totalTableWidth - labelColWidth;
    const dashWidth = 0.15;
    const gapWidth = 0.1;
    const numDashes = Math.floor(lineWidth / (dashWidth + gapWidth));

    for (let d = 0; d < numDashes; d++) {
      slide.addShape("rect", {
        x: lineStartX + d * (dashWidth + gapWidth),
        y: y - 0.01,
        w: dashWidth,
        h: 0.02,
        fill: { color: COLORS.brand },
      });
    }

    // Label for the line
    slide.addText(line.label, {
      x: tableStartX + totalTableWidth - 2.2,
      y: y - 0.2,
      w: 2.0,
      h: 0.18,
      fontSize: 6,
      color: COLORS.brand,
      fontFace: FONT,
      italic: true,
      align: "right",
    });
  }

  addBottomBar(slide);
}

function buildStageDetailSlide(
  pptx: PptxGenJS,
  data: ExportData,
  stageIndex: number
) {
  const stage = data.stages[stageIndex];
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, data.projectName);

  addSlideTitle(slide, `Stage ${stageIndex + 1}: ${stage.label}`);

  if (stage.description) {
    slide.addText(stage.description, {
      x: 0.6,
      y: 1.15,
      w: 8.8,
      h: 0.6,
      fontSize: 12,
      color: COLORS.textMuted,
      fontFace: FONT,
      italic: true,
    });
  }

  const stageNodes = data.nodes.filter((n) => n.stage_index === stageIndex);
  const touchpoints = stageNodes.filter(
    (n) =>
      n.type === "touchpoint" ||
      n.type === "action" ||
      n.type === "moment_of_truth"
  );
  const painPoints = stageNodes.filter((n) => n.type === "pain_point");
  const opportunities = stageNodes.filter((n) => n.type === "opportunity");

  const colWidth = 2.8;
  const colGap = 0.3;
  const startY = stage.description ? 1.9 : 1.3;
  const columns = [
    {
      title: "Touchpoints",
      items: touchpoints,
      color: COLORS.brand,
      x: 0.6,
    },
    {
      title: "Pain Points",
      items: painPoints,
      color: COLORS.red,
      x: 0.6 + colWidth + colGap,
    },
    {
      title: "Opportunities",
      items: opportunities,
      color: COLORS.green,
      x: 0.6 + 2 * (colWidth + colGap),
    },
  ];

  for (const col of columns) {
    // Column header
    slide.addText(col.title, {
      x: col.x,
      y: startY,
      w: colWidth,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: col.color,
      fontFace: FONT,
    });

    // Divider
    slide.addShape("rect", {
      x: col.x,
      y: startY + 0.42,
      w: colWidth,
      h: 0.02,
      fill: { color: col.color },
    });

    // Items
    if (col.items.length === 0) {
      slide.addText("None identified", {
        x: col.x,
        y: startY + 0.6,
        w: colWidth,
        h: 0.35,
        fontSize: 11,
        color: COLORS.textMuted,
        fontFace: FONT,
        italic: true,
      });
    } else {
      const bullets = col.items.map((item) => ({
        text: item.description
          ? `${item.label}: ${truncate(item.description, 60)}`
          : item.label,
        options: {
          fontSize: 11,
          color: COLORS.text,
          fontFace: FONT,
          bullet: { code: "2022", color: col.color },
          lineSpacingMultiple: 1.3,
          paraSpaceAfter: 4,
        },
      }));

      slide.addText(bullets, {
        x: col.x,
        y: startY + 0.6,
        w: colWidth,
        h: 4.5,
        valign: "top",
      });
    }
  }

  addBottomBar(slide);
}

function buildPersonaSlide(
  pptx: PptxGenJS,
  persona: ExportData["personas"][number],
  projectName: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, projectName);

  addSlideTitle(slide, persona.name);

  if (persona.role) {
    slide.addText(persona.role, {
      x: 0.6,
      y: 1.05,
      w: 8.8,
      h: 0.35,
      fontSize: 14,
      color: COLORS.brand,
      fontFace: FONT,
    });
  }

  const bioY = persona.role ? 1.5 : 1.2;

  if (persona.bio) {
    slide.addText(persona.bio, {
      x: 0.6,
      y: bioY,
      w: 8.8,
      h: 0.7,
      fontSize: 12,
      color: COLORS.textMuted,
      fontFace: FONT,
      italic: true,
      lineSpacingMultiple: 1.3,
    });
  }

  const sectionY = bioY + (persona.bio ? 0.85 : 0.15);

  // Goals
  const leftX = 0.6;
  const rightX = 5.2;
  const secWidth = 4.2;

  slide.addText("Goals", {
    x: leftX,
    y: sectionY,
    w: secWidth,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: COLORS.green,
    fontFace: FONT,
  });

  if (persona.goals.length > 0) {
    const goalBullets = persona.goals.map((g) => ({
      text: g,
      options: {
        fontSize: 11,
        color: COLORS.text,
        fontFace: FONT,
        bullet: { code: "2713", color: COLORS.green },
        lineSpacingMultiple: 1.3,
        paraSpaceAfter: 3,
      },
    }));
    slide.addText(goalBullets, {
      x: leftX,
      y: sectionY + 0.4,
      w: secWidth,
      h: 2.0,
      valign: "top",
    });
  }

  // Frustrations
  slide.addText("Frustrations", {
    x: rightX,
    y: sectionY,
    w: secWidth,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: COLORS.red,
    fontFace: FONT,
  });

  if (persona.frustrations.length > 0) {
    const frusBullets = persona.frustrations.map((f) => ({
      text: f,
      options: {
        fontSize: 11,
        color: COLORS.text,
        fontFace: FONT,
        bullet: { code: "2717", color: COLORS.red },
        lineSpacingMultiple: 1.3,
        paraSpaceAfter: 3,
      },
    }));
    slide.addText(frusBullets, {
      x: rightX,
      y: sectionY + 0.4,
      w: secWidth,
      h: 2.0,
      valign: "top",
    });
  }

  // Quote
  if (persona.quotes.length > 0) {
    const quoteY = sectionY + 2.6;
    slide.addShape("rect", {
      x: 0.6,
      y: quoteY,
      w: 8.8,
      h: 0.02,
      fill: { color: COLORS.divider },
    });

    slide.addText(`"${persona.quotes[0]}"`, {
      x: 0.8,
      y: quoteY + 0.15,
      w: 8.4,
      h: 0.6,
      fontSize: 13,
      color: COLORS.brand,
      fontFace: FONT,
      italic: true,
      align: "center",
    });
  }

  addBottomBar(slide);
}

function buildPainPointsOpportunitiesSlide(pptx: PptxGenJS, data: ExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, data.projectName);

  addSlideTitle(slide, "Pain Points & Opportunities");

  const colWidth = 4.2;
  const leftX = 0.6;
  const rightX = 5.2;
  const startY = 1.3;

  // Pain Points column
  slide.addText("Pain Points", {
    x: leftX,
    y: startY,
    w: colWidth,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.red,
    fontFace: FONT,
  });

  slide.addShape("rect", {
    x: leftX,
    y: startY + 0.45,
    w: colWidth,
    h: 0.02,
    fill: { color: COLORS.red },
  });

  if (data.painPoints.length > 0) {
    const painBullets = data.painPoints.map((p) => ({
      text: truncate(p, 80),
      options: {
        fontSize: 11,
        color: COLORS.text,
        fontFace: FONT,
        bullet: { code: "26A0", color: COLORS.red },
        lineSpacingMultiple: 1.4,
        paraSpaceAfter: 6,
      },
    }));
    slide.addText(painBullets, {
      x: leftX,
      y: startY + 0.6,
      w: colWidth,
      h: 5.2,
      valign: "top",
    });
  } else {
    slide.addText("No pain points identified.", {
      x: leftX,
      y: startY + 0.6,
      w: colWidth,
      h: 0.4,
      fontSize: 11,
      color: COLORS.textMuted,
      fontFace: FONT,
      italic: true,
    });
  }

  // Divider between columns
  slide.addShape("rect", {
    x: 4.95,
    y: startY,
    w: 0.02,
    h: 5.5,
    fill: { color: COLORS.divider },
  });

  // Opportunities column
  slide.addText("Opportunities", {
    x: rightX,
    y: startY,
    w: colWidth,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.green,
    fontFace: FONT,
  });

  slide.addShape("rect", {
    x: rightX,
    y: startY + 0.45,
    w: colWidth,
    h: 0.02,
    fill: { color: COLORS.green },
  });

  if (data.opportunities.length > 0) {
    const oppBullets = data.opportunities.map((o) => ({
      text: truncate(o, 80),
      options: {
        fontSize: 11,
        color: COLORS.text,
        fontFace: FONT,
        bullet: { code: "2728", color: COLORS.green },
        lineSpacingMultiple: 1.4,
        paraSpaceAfter: 6,
      },
    }));
    slide.addText(oppBullets, {
      x: rightX,
      y: startY + 0.6,
      w: colWidth,
      h: 5.2,
      valign: "top",
    });
  } else {
    slide.addText("No opportunities identified.", {
      x: rightX,
      y: startY + 0.6,
      w: colWidth,
      h: 0.4,
      fontSize: 11,
      color: COLORS.textMuted,
      fontFace: FONT,
      italic: true,
    });
  }

  addBottomBar(slide);
}

function buildKeyFindingsSlide(
  pptx: PptxGenJS,
  findings: ExportData["findings"],
  projectName: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, projectName);

  addSlideTitle(slide, "Key Findings");

  if (findings.length === 0) {
    slide.addText("No research findings recorded.", {
      x: 0.6,
      y: 2.5,
      w: 8.8,
      h: 0.5,
      fontSize: 14,
      color: COLORS.textMuted,
      fontFace: FONT,
      italic: true,
    });
    addBottomBar(slide);
    return;
  }

  const typeColors: Record<string, string> = {
    insight: COLORS.brand,
    quote: COLORS.textMuted,
    pain_point: COLORS.red,
    need: COLORS.green,
    behavior: COLORS.text,
    opportunity: COLORS.green,
  };

  // Show up to 12 findings per slide
  const maxFindings = Math.min(findings.length, 12);
  const bullets = findings.slice(0, maxFindings).map((f) => ({
    text: `[${f.type.replace("_", " ").toUpperCase()}] ${truncate(f.content, 90)}`,
    options: {
      fontSize: 11,
      color: typeColors[f.type] || COLORS.text,
      fontFace: FONT,
      bullet: { code: "2022", color: COLORS.brand },
      lineSpacingMultiple: 1.5,
      paraSpaceAfter: 6,
    },
  }));

  slide.addText(bullets, {
    x: 0.6,
    y: 1.3,
    w: 8.8,
    h: 5.5,
    valign: "top",
  });

  if (findings.length > maxFindings) {
    slide.addText(
      `+ ${findings.length - maxFindings} additional findings`,
      {
        x: 0.6,
        y: 6.8,
        w: 8.8,
        h: 0.35,
        fontSize: 10,
        color: COLORS.textMuted,
        fontFace: FONT,
        italic: true,
        align: "right",
      }
    );
  }

  addBottomBar(slide);
}

function buildRecommendationsSlide(
  pptx: PptxGenJS,
  recommendations: NonNullable<ExportData["recommendations"]>,
  projectName: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, projectName);

  addSlideTitle(slide, "Recommendations");

  // Impact priority order for sorting
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations]
    .sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9))
    .slice(0, 8);

  // Color coding helper
  function levelColor(level: string): string {
    switch (level.toLowerCase()) {
      case "high":
        return COLORS.red;
      case "medium":
        return COLORS.amber;
      case "low":
        return COLORS.green;
      default:
        return COLORS.textMuted;
    }
  }

  // Table header
  const headerRow = [
    { text: "#", options: { fontSize: 8, bold: true, color: COLORS.white, fontFace: FONT, fill: { color: COLORS.brand }, align: "center" as const } },
    { text: "Title", options: { fontSize: 8, bold: true, color: COLORS.white, fontFace: FONT, fill: { color: COLORS.brand } } },
    { text: "Impact", options: { fontSize: 8, bold: true, color: COLORS.white, fontFace: FONT, fill: { color: COLORS.brand }, align: "center" as const } },
    { text: "Effort", options: { fontSize: 8, bold: true, color: COLORS.white, fontFace: FONT, fill: { color: COLORS.brand }, align: "center" as const } },
    { text: "Status", options: { fontSize: 8, bold: true, color: COLORS.white, fontFace: FONT, fill: { color: COLORS.brand }, align: "center" as const } },
  ];

  const dataRows = sorted.map((rec, idx) => [
    { text: `${idx + 1}`, options: { fontSize: 8, color: COLORS.textMuted, fontFace: FONT, fill: { color: COLORS.cardBg }, align: "center" as const } },
    { text: truncate(rec.title, 50), options: { fontSize: 8, color: COLORS.text, fontFace: FONT, fill: { color: COLORS.cardBg } } },
    { text: rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1), options: { fontSize: 8, color: levelColor(rec.impact), fontFace: FONT, fill: { color: COLORS.cardBg }, align: "center" as const, bold: true } },
    { text: rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1), options: { fontSize: 8, color: levelColor(rec.effort), fontFace: FONT, fill: { color: COLORS.cardBg }, align: "center" as const, bold: true } },
    { text: rec.status.replace(/_/g, " ").charAt(0).toUpperCase() + rec.status.replace(/_/g, " ").slice(1), options: { fontSize: 8, color: COLORS.textMuted, fontFace: FONT, fill: { color: COLORS.cardBg }, align: "center" as const } },
  ]);

  const tableRows = [headerRow, ...dataRows];
  const colWidths = [0.4, 4.4, 1.2, 1.2, 1.6];

  slide.addTable(tableRows as PptxGenJS.TableRow[], {
    x: 0.6,
    y: 1.3,
    w: 8.8,
    colW: colWidths,
    rowH: 0.4,
    border: { type: "solid", pt: 0.5, color: COLORS.divider },
    margin: [4, 6, 4, 6],
  });

  addBottomBar(slide);
}

function buildClosingSlide(pptx: PptxGenJS, data: ExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addSlideChrome(slide, data.projectName);

  slide.addText("Thank You", {
    x: 0,
    y: 1.8,
    w: "100%",
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: COLORS.brand,
    fontFace: FONT,
    align: "center",
  });

  slide.addShape("rect", {
    x: 4.0,
    y: 2.9,
    w: 2.0,
    h: 0.04,
    fill: { color: COLORS.brand },
  });

  slide.addText("Next Steps", {
    x: 1.5,
    y: 3.3,
    w: 7.0,
    h: 0.5,
    fontSize: 18,
    color: COLORS.text,
    fontFace: FONT,
    align: "center",
  });

  // Use top 3 recommendations as next steps if available
  let nextSteps: string[];
  const recs = data.recommendations;
  if (recs && recs.length > 0) {
    const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sorted = [...recs]
      .sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9))
      .slice(0, 3);
    nextSteps = sorted.map(
      (r) => `${r.title} (${r.impact} impact, ${r.effort} effort)`
    );
    // Add a generic follow-up step
    nextSteps.push("Schedule follow-up to track implementation progress");
  } else {
    nextSteps = [
      "Review and validate journey map findings with stakeholders",
      "Prioritize pain points and opportunities for action",
      "Define success metrics and implementation roadmap",
      "Schedule follow-up sessions to track progress",
    ];
  }

  const bullets = nextSteps.map((step) => ({
    text: step,
    options: {
      fontSize: 13,
      color: COLORS.textMuted,
      fontFace: FONT,
      bullet: { code: "2192", color: COLORS.brand },
      lineSpacingMultiple: 1.6,
      paraSpaceAfter: 8,
    },
  }));

  slide.addText(bullets, {
    x: 1.5,
    y: 4.0,
    w: 7.0,
    h: 2.8,
    valign: "top",
  });

  slide.addText(`${data.projectName} | ${formatDate()}`, {
    x: 0,
    y: 6.9,
    w: "100%",
    h: 0.35,
    fontSize: 10,
    color: COLORS.textMuted,
    fontFace: FONT,
    align: "center",
  });

  addBottomBar(slide);
}

// ── Main generator ─────────────────────────────────────────────────────

export async function generatePPTX(data: ExportData): Promise<Buffer> {
  // Reset slide counter
  slideCounter = 0;

  // Apply branding overrides
  COLORS = { ...DEFAULT_COLORS };
  if (data.branding?.accentColor) {
    // Strip # if provided
    COLORS.brand = data.branding.accentColor.replace(/^#/, "");
  }

  const pptx = new PptxGenJS();

  pptx.author = "JourneyMapper";
  pptx.title = data.projectName;
  pptx.subject = "Journey Map Export";
  pptx.layout = "LAYOUT_WIDE";

  // 1. Title slide (no chrome)
  buildTitleSlide(pptx, data);

  // 2. Executive summary (if provided)
  if (data.executiveSummary) {
    buildExecutiveSummarySlide(pptx, data.executiveSummary, data.projectName);
  }

  // 3. Blueprint overview (replaces journey overview)
  if (data.stages.length > 0) {
    buildBlueprintOverviewSlide(pptx, data);
  }

  // 4. Stage detail slides
  for (let i = 0; i < data.stages.length; i++) {
    buildStageDetailSlide(pptx, data, i);
  }

  // 5. Persona slides
  for (const persona of data.personas) {
    buildPersonaSlide(pptx, persona, data.projectName);
  }

  // 6. Pain points & opportunities
  if (data.painPoints.length > 0 || data.opportunities.length > 0) {
    buildPainPointsOpportunitiesSlide(pptx, data);
  }

  // 7. Key findings
  if (data.findings.length > 0) {
    buildKeyFindingsSlide(pptx, data.findings, data.projectName);
  }

  // 8. Recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    buildRecommendationsSlide(pptx, data.recommendations, data.projectName);
  }

  // 9. Closing slide
  buildClosingSlide(pptx, data);

  const output = await pptx.write({ outputType: "nodebuffer" });
  return output as Buffer;
}
