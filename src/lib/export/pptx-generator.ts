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
}

// ── Design tokens ──────────────────────────────────────────────────────

const COLORS = {
  bg: "1A1816",
  text: "F0ECE6",
  textMuted: "A8A29E",
  amber: "D4A453",
  red: "E57373",
  green: "81C784",
  white: "FFFFFF",
  cardBg: "252220",
  divider: "3A3634",
} as const;

const FONT = "Calibri";

// ── Helpers ────────────────────────────────────────────────────────────

function addBottomBar(slide: PptxGenJS.Slide) {
  slide.addShape("rect", {
    x: 0,
    y: 7.35,
    w: "100%",
    h: 0.15,
    fill: { color: COLORS.amber },
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
    color: COLORS.amber,
    fontFace: FONT,
  });

  // Accent line under title
  slide.addShape("rect", {
    x: 0.6,
    y: 0.95,
    w: 1.5,
    h: 0.04,
    fill: { color: COLORS.amber },
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
    fill: { color: COLORS.amber },
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

  slide.addText("Created with JourneyMapper", {
    x: 0.8,
    y: 6.4,
    w: 4,
    h: 0.4,
    fontSize: 11,
    color: COLORS.amber,
    fontFace: FONT,
    italic: true,
  });

  addBottomBar(slide);
}

function buildExecutiveSummarySlide(pptx: PptxGenJS, summary: string) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  addSlideTitle(slide, "Executive Summary");

  // Amber accent bar beside text
  slide.addShape("rect", {
    x: 0.6,
    y: 1.3,
    w: 0.06,
    h: 4.5,
    fill: { color: COLORS.amber },
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

function buildJourneyOverviewSlide(pptx: PptxGenJS, data: ExportData) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  addSlideTitle(slide, "Journey Overview");

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

  const maxVisible = Math.min(stageCount, 8);
  const totalWidth = 8.6;
  const gap = 0.15;
  const boxWidth = (totalWidth - gap * (maxVisible - 1)) / maxVisible;
  const startX = 0.7;
  const yTop = 1.6;
  const boxHeight = 1.0;

  for (let i = 0; i < maxVisible; i++) {
    const stage = data.stages[i];
    const x = startX + i * (boxWidth + gap);

    // Stage box
    slide.addShape("roundRect", {
      x,
      y: yTop,
      w: boxWidth,
      h: boxHeight,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.amber, width: 1 },
      rectRadius: 0.08,
    });

    // Stage number
    slide.addText(`${i + 1}`, {
      x,
      y: yTop + 0.08,
      w: boxWidth,
      h: 0.3,
      fontSize: 10,
      color: COLORS.amber,
      fontFace: FONT,
      bold: true,
      align: "center",
    });

    // Stage label
    slide.addText(truncate(stage.label, 30), {
      x: x + 0.05,
      y: yTop + 0.35,
      w: boxWidth - 0.1,
      h: 0.55,
      fontSize: 9,
      color: COLORS.text,
      fontFace: FONT,
      align: "center",
      valign: "top",
    });

    // Arrow between stages
    if (i < maxVisible - 1) {
      const arrowX = x + boxWidth;
      slide.addShape("rect", {
        x: arrowX,
        y: yTop + boxHeight / 2 - 0.015,
        w: gap,
        h: 0.03,
        fill: { color: COLORS.amber },
      });
    }
  }

  // Count of nodes per stage below
  const yStats = yTop + boxHeight + 0.4;
  for (let i = 0; i < maxVisible; i++) {
    const x = startX + i * (boxWidth + gap);
    const nodesInStage = data.nodes.filter((n) => n.stage_index === i);
    const touchpoints = nodesInStage.filter(
      (n) => n.type === "touchpoint" || n.type === "action"
    ).length;
    const painCount = nodesInStage.filter(
      (n) => n.type === "pain_point"
    ).length;

    const statsText = `${touchpoints} touchpoint${touchpoints !== 1 ? "s" : ""}${painCount > 0 ? ` | ${painCount} pain` : ""}`;
    slide.addText(statsText, {
      x: x + 0.02,
      y: yStats,
      w: boxWidth - 0.04,
      h: 0.35,
      fontSize: 7,
      color: COLORS.textMuted,
      fontFace: FONT,
      align: "center",
    });
  }

  // Emotional journey line (if sentiment data exists)
  const sentimentNodes = data.nodes.filter(
    (n) => n.sentiment !== undefined && n.sentiment !== null
  );
  if (sentimentNodes.length > 0) {
    const yEmotionLabel = yStats + 0.6;
    slide.addText("Emotional Journey", {
      x: 0.6,
      y: yEmotionLabel,
      w: 3,
      h: 0.35,
      fontSize: 11,
      color: COLORS.amber,
      fontFace: FONT,
      bold: true,
    });

    // Average sentiment per stage as bar indicators
    const yBars = yEmotionLabel + 0.45;
    for (let i = 0; i < maxVisible; i++) {
      const x = startX + i * (boxWidth + gap);
      const stageNodes = sentimentNodes.filter((n) => n.stage_index === i);
      if (stageNodes.length === 0) continue;

      const avg =
        stageNodes.reduce((sum, n) => sum + (n.sentiment ?? 0), 0) /
        stageNodes.length;
      const barColor =
        avg >= 0.3 ? COLORS.green : avg <= -0.3 ? COLORS.red : COLORS.amber;
      const barHeight = Math.max(0.08, Math.abs(avg) * 0.6);

      slide.addShape("rect", {
        x: x + boxWidth / 2 - 0.1,
        y: yBars + (0.6 - barHeight) / 2,
        w: 0.2,
        h: barHeight,
        fill: { color: barColor },
        rectRadius: 0.04,
      });
    }
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
      color: COLORS.amber,
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
  persona: ExportData["personas"][number]
) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  addSlideTitle(slide, persona.name);

  if (persona.role) {
    slide.addText(persona.role, {
      x: 0.6,
      y: 1.05,
      w: 8.8,
      h: 0.35,
      fontSize: 14,
      color: COLORS.amber,
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
      color: COLORS.amber,
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
  findings: ExportData["findings"]
) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

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
    insight: COLORS.amber,
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
      bullet: { code: "2022", color: COLORS.amber },
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

function buildClosingSlide(pptx: PptxGenJS, projectName: string) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  slide.addText("Thank You", {
    x: 0,
    y: 1.8,
    w: "100%",
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: COLORS.amber,
    fontFace: FONT,
    align: "center",
  });

  slide.addShape("rect", {
    x: 4.0,
    y: 2.9,
    w: 2.0,
    h: 0.04,
    fill: { color: COLORS.amber },
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

  const nextSteps = [
    "Review and validate journey map findings with stakeholders",
    "Prioritize pain points and opportunities for action",
    "Define success metrics and implementation roadmap",
    "Schedule follow-up sessions to track progress",
  ];

  const bullets = nextSteps.map((step) => ({
    text: step,
    options: {
      fontSize: 13,
      color: COLORS.textMuted,
      fontFace: FONT,
      bullet: { code: "2192", color: COLORS.amber },
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

  slide.addText(`${projectName} | ${formatDate()}`, {
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
  const pptx = new PptxGenJS();

  pptx.author = "JourneyMapper";
  pptx.title = data.projectName;
  pptx.subject = "Journey Map Export";
  pptx.layout = "LAYOUT_WIDE";

  // 1. Title slide
  buildTitleSlide(pptx, data);

  // 2. Executive summary (if provided)
  if (data.executiveSummary) {
    buildExecutiveSummarySlide(pptx, data.executiveSummary);
  }

  // 3. Journey overview
  if (data.stages.length > 0) {
    buildJourneyOverviewSlide(pptx, data);
  }

  // 4. Stage detail slides
  for (let i = 0; i < data.stages.length; i++) {
    buildStageDetailSlide(pptx, data, i);
  }

  // 5. Persona slides
  for (const persona of data.personas) {
    buildPersonaSlide(pptx, persona);
  }

  // 6. Pain points & opportunities
  if (data.painPoints.length > 0 || data.opportunities.length > 0) {
    buildPainPointsOpportunitiesSlide(pptx, data);
  }

  // 7. Key findings
  if (data.findings.length > 0) {
    buildKeyFindingsSlide(pptx, data.findings);
  }

  // 8. Closing slide
  buildClosingSlide(pptx, data.projectName);

  const output = await pptx.write({ outputType: "nodebuffer" });
  return output as Buffer;
}
