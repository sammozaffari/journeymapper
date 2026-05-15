import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { SYNTHESIS_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { synthesisSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch all findings for the project
    const { data: findings, error: findingsError } = await supabase
      .from("findings")
      .select("*")
      .eq("project_id", projectId);

    if (findingsError) {
      return NextResponse.json(
        { error: "Failed to fetch findings", message: findingsError.message },
        { status: 500 }
      );
    }

    if (!findings || findings.length === 0) {
      return NextResponse.json(
        { error: "No findings found for this project" },
        { status: 404 }
      );
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Please synthesize the following research findings into patterns, persona suggestions, journey stages, critical pain points, and opportunities. Return a JSON object.\n\nFindings:\n${JSON.stringify(findings, null, 2)}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    const rawParsed = JSON.parse(text);
    const synthesis = synthesisSchema.parse(rawParsed);

    return NextResponse.json({ success: true, data: synthesis });
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      { error: "Synthesis failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
