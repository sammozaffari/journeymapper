import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/ai/mock-wrapper";

const requestSchema = z.object({
  projectId: z.string().uuid(),
});

const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  solution_type: z.enum([
    "process_change",
    "ui_improvement",
    "training",
    "policy_update",
    "communication",
    "technology",
  ]),
  impact: z.enum(["low", "medium", "high"]),
  effort: z.enum(["low", "medium", "high"]),
  linked_insight_id: z.string().nullable().optional(),
  linked_node_id: z.string().nullable().optional(),
});

const SYSTEM_PROMPT = `You are a service design consultant generating actionable recommendations. Based on the pain points and opportunities identified, generate specific, implementable recommendations. Each should have a clear title, description, solution type, impact level, and effort level. Focus on actionable improvements, not vague suggestions.

Solution types: process_change, ui_improvement, training, policy_update, communication, technology.
Impact levels: low, medium, high.
Effort levels: low, medium, high.

Return a JSON array of recommendation objects. Each object must have:
- title: A short, clear recommendation title
- description: 2-3 sentences describing the recommendation and expected outcome
- solution_type: One of the solution types above
- impact: Impact level
- effort: Effort level
- linked_insight_id: The ID of the related finding (if applicable, otherwise null)
- linked_node_id: The ID of the related map node (if applicable, otherwise null)

Return ONLY valid JSON, no markdown or extra text.`;

const MOCK_RECOMMENDATIONS = [
  {
    title: "Streamline onboarding form to reduce drop-off",
    description:
      "Simplify the multi-step onboarding form by reducing required fields from 12 to 5. Pre-fill known data from SSO. Expected to reduce drop-off by 30-40%.",
    solution_type: "ui_improvement",
    impact: "high",
    effort: "medium",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Add proactive chat support at key friction points",
    description:
      "Deploy contextual chat prompts at the three highest-friction touchpoints identified in the journey. Use canned responses for common issues to reduce resolution time.",
    solution_type: "communication",
    impact: "high",
    effort: "low",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Create self-service knowledge base for common queries",
    description:
      "Build a searchable FAQ and troubleshooting guide covering the top 20 support topics. Integrate with in-app help to deflect 25% of support tickets.",
    solution_type: "technology",
    impact: "medium",
    effort: "medium",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Revise escalation policy for high-priority issues",
    description:
      "Update the current escalation matrix to include automatic routing for severity-1 issues. Set SLA targets of 15 minutes for initial response. Reduces average resolution time.",
    solution_type: "policy_update",
    impact: "high",
    effort: "low",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Train frontline staff on empathetic response patterns",
    description:
      "Develop a half-day training module focused on empathetic language, active listening, and de-escalation. Role-play scenarios based on actual pain points identified in research.",
    solution_type: "training",
    impact: "medium",
    effort: "low",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Automate status notifications across channels",
    description:
      "Implement automated email and SMS notifications for order status changes. Customers currently have to check manually, which is a major pain point. Expected to reduce 'where is my order' inquiries by 50%.",
    solution_type: "process_change",
    impact: "high",
    effort: "high",
    linked_insight_id: null,
    linked_node_id: null,
  },
  {
    title: "Redesign error messages with actionable guidance",
    description:
      "Replace generic error codes with plain-language messages that include specific next steps. Audit all error states and provide contextual help links.",
    solution_type: "ui_improvement",
    impact: "low",
    effort: "low",
    linked_insight_id: null,
    linked_node_id: null,
  },
];

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

    // Fetch findings (pain_points and opportunities)
    const { data: findings, error: findingsError } = await supabase
      .from("findings")
      .select("*")
      .eq("project_id", projectId)
      .in("type", ["pain_point", "opportunity"]);

    if (findingsError) {
      return NextResponse.json(
        { error: "Failed to fetch findings", message: findingsError.message },
        { status: 500 }
      );
    }

    // Fetch map_nodes (pain_points and opportunities)
    const { data: nodes, error: nodesError } = await supabase
      .from("map_nodes")
      .select("*")
      .eq("project_id", projectId)
      .in("type", ["pain_point", "opportunity"]);

    if (nodesError) {
      return NextResponse.json(
        { error: "Failed to fetch map nodes", message: nodesError.message },
        { status: 500 }
      );
    }

    const hasData =
      (findings && findings.length > 0) || (nodes && nodes.length > 0);

    let generatedRecs;

    if (isMockMode() || !hasData) {
      // Use mock data
      await new Promise((resolve) => setTimeout(resolve, 1500));
      generatedRecs = MOCK_RECOMMENDATIONS;
    } else {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate actionable recommendations based on the following pain points and opportunities.\n\nFindings:\n${JSON.stringify(
              findings,
              null,
              2
            )}\n\nMap Nodes:\n${JSON.stringify(nodes, null, 2)}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.text || "[]";
      const rawParsed = JSON.parse(text);
      const validated = z.array(recommendationSchema).parse(rawParsed);
      generatedRecs = validated;
    }

    // Insert into recommendations table
    const toInsert = generatedRecs.map((rec) => ({
      project_id: projectId,
      insight_id: rec.linked_insight_id || null,
      node_id: rec.linked_node_id || null,
      solution_type: rec.solution_type,
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      effort: rec.effort,
      owner: null,
      status: "proposed",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("recommendations")
      .insert(toInsert)
      .select();

    if (insertError) {
      return NextResponse.json(
        {
          error: "Failed to save recommendations",
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    console.error("Recommendations generation error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
