import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { PERSONA_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { personaSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  context: z.string().min(1),
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

    const { projectId, context } = parsed.data;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: PERSONA_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Based on the following research data, generate a detailed persona. Return a JSON object with name, role, bio, demographics, goals, frustrations, behaviors, and quotes.\n\n${context}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    const rawParsed = JSON.parse(text);
    const persona = personaSchema.parse(rawParsed);

    // Create persona record in the database
    const supabase = await createClient();
    const { data: createdPersona, error: insertError } = await supabase
      .from("personas")
      .insert({
        project_id: projectId,
        name: persona.name,
        role: persona.role,
        bio: persona.bio,
        demographics: persona.demographics,
        goals: persona.goals,
        frustrations: persona.frustrations,
        behaviors: persona.behaviors,
        quotes: persona.quotes,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save persona", message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: createdPersona });
  } catch (error) {
    console.error("Persona generation error:", error);
    return NextResponse.json(
      { error: "Persona generation failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
