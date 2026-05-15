import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { extractionSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_EXTRACTION } from "@/lib/ai/mock-data";

const requestSchema = z.object({
  researchItemId: z.string().uuid(),
  content: z.string().min(1),
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

    const { researchItemId, content } = parsed.data;
    const supabase = await createClient();

    // Update status to processing
    await supabase
      .from("research_items")
      .update({ ai_status: "processing" })
      .eq("id", researchItemId);

    let extraction;
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 1500)); // Simulate delay
      extraction = MOCK_EXTRACTION;
    } else {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Please analyze the following research content and return a JSON object with themes, quotes, pain_points, insights, and overall_sentiment.\n\n${content}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.text || "";
      const rawParsed = JSON.parse(text);
      extraction = extractionSchema.parse(rawParsed);
    }

    // Update research item with extraction results
    await supabase
      .from("research_items")
      .update({
        ai_extracted: extraction,
        ai_status: "completed",
      })
      .eq("id", researchItemId);

    // Get the research item to find the project_id
    const { data: researchItem } = await supabase
      .from("research_items")
      .select("project_id")
      .eq("id", researchItemId)
      .single();

    if (researchItem) {
      // Create findings records
      const findings = [
        ...extraction.insights.map((insight) => ({
          project_id: researchItem.project_id,
          research_item_id: researchItemId,
          type: insight.type,
          content: insight.content,
          confidence: insight.confidence,
        })),
        ...extraction.pain_points.map((pp) => ({
          project_id: researchItem.project_id,
          research_item_id: researchItemId,
          type: "pain_point" as const,
          content: pp.description,
          severity: pp.severity,
        })),
      ];

      if (findings.length > 0) {
        await supabase.from("findings").insert(findings);
      }
    }

    return NextResponse.json({ success: true, data: extraction });
  } catch (error) {
    console.error("Extraction error:", error);

    // Try to update status to failed
    try {
      const body = await request.clone().json();
      if (body.researchItemId) {
        const supabase = await createClient();
        await supabase
          .from("research_items")
          .update({ ai_status: "failed" })
          .eq("id", body.researchItemId);
      }
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      { error: "Extraction failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
