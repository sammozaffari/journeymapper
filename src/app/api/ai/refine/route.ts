import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { PROBLEM_REFINEMENT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { problemStatementSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_PROBLEM_STATEMENT } from "@/lib/ai/mock-data";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  statement: z.string().min(1),
  context: z.string().optional(),
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

    const { projectId, statement, context } = parsed.data;

    let refined;
    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      refined = MOCK_PROBLEM_STATEMENT;
    } else {
      const userContent = context
        ? `Problem statement: ${statement}\n\nAdditional context:\n${context}`
        : `Problem statement: ${statement}`;

      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: PROBLEM_REFINEMENT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Please refine the following problem statement into a structured format. Return a JSON object with statement, context, impact, current_state, desired_state, constraints, and assumptions.\n\n${userContent}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.text || "";
      const rawParsed = JSON.parse(text);
      refined = problemStatementSchema.parse(rawParsed);
    }

    const supabase = await createClient();

    // Check if a problem statement already exists for this project
    const { data: existing } = await supabase
      .from("problem_statements")
      .select("id")
      .eq("project_id", projectId)
      .single();

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("problem_statements")
        .update({
          statement: refined.statement,
          context: refined.context,
          impact: refined.impact,
          current_state: refined.current_state,
          desired_state: refined.desired_state,
          constraints: refined.constraints,
          assumptions: refined.assumptions,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update problem statement", message: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("problem_statements")
        .insert({
          project_id: projectId,
          statement: refined.statement,
          context: refined.context,
          impact: refined.impact,
          current_state: refined.current_state,
          desired_state: refined.desired_state,
          constraints: refined.constraints,
          assumptions: refined.assumptions,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to create problem statement", message: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Problem refinement error:", error);
    return NextResponse.json(
      { error: "Problem refinement failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
