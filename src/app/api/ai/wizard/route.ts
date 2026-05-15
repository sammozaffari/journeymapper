import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import {
  MOCK_PROBLEM_STATEMENT,
  MOCK_SYNTHESIS,
  MOCK_PERSONA,
  MOCK_MAP_GENERATION,
} from "@/lib/ai/mock-data";

/* ---------- Phase system prompts ---------- */

const PHASE_SYSTEM_PROMPTS = [
  `You are helping define a problem statement for a service design project. Ask focused questions about the service, the problem, who's affected, and what success looks like. Keep it to 2-3 exchanges. Be conversational, concise, and encouraging. Don't use bullet lists in chat — speak naturally.`,
  `You are gathering research context. Ask about existing research, customer feedback, known pain points, and behavioral patterns. Build on the problem statement from Phase 0. Keep responses short and ask one question at a time.`,
  `You are helping identify personas. Based on the problem and research context, ask about different user types, their goals, frustrations, and behaviors. Help the user think about distinct segments. Keep it conversational.`,
  `You are mapping the customer journey. Based on everything learned, ask about the stages customers go through, touchpoints at each stage, pain points, and emotional highs/lows. Guide the user through the journey step by step.`,
];

const PHASE_GENERATE_PROMPTS = [
  `Based on the conversation, generate a structured problem statement. Return a JSON object with these fields: statement (string), context (string), impact (string), current_state (string), desired_state (string), constraints (string array), assumptions (string array). Be specific and grounded in what was discussed.`,
  `Based on the conversation and the problem statement context, synthesize the research into structured findings. Return a JSON object with: themes (array of {label, description, frequency}), pain_points (array of {description, severity, stage_suggestion}), insights (array of {content, type, confidence}). Use only what was discussed.`,
  `Based on the conversation, problem statement, and research context, generate personas. Return a JSON object with: personas (array of {name, role, bio, goals (string array), frustrations (string array), behaviors (string array), quotes (string array)}). Create 1-3 personas based on what was discussed.`,
  `Based on everything discussed, generate a complete journey map structure. Return a JSON object with: stages (array of {label, description}), nodes (array of {type, label, description, stage_index, lane, sentiment?, severity?}), connections (array of {from_index, to_index, type}). The type field uses: touchpoint, pain_point, opportunity, moment_of_truth, evidence_item, action, emotion, note. The lane field uses: customer_actions, frontstage, backstage, support_processes, physical_evidence, emotional_journey.`,
];

/* ---------- Mock chat responses per phase ---------- */

const MOCK_PHASE_CHAT: Record<number, string[]> = {
  0: [
    "That's a great starting point. Can you tell me more about who's most affected by this problem? Are there specific user groups or customer segments that feel this pain more than others?",
    "I'm getting a clear picture. What does success look like for you? If this problem were solved, what would be different for your users and your business?",
    "Excellent. I have enough to generate a structured problem statement. Click the Generate button when you're ready, or keep sharing details if there's more context.",
  ],
  1: [
    "Thanks for that context. Have you done any customer interviews or surveys? Even informal feedback from support tickets or reviews can help. What have users actually told you?",
    "Those are valuable data points. Are there any behavioral patterns you've noticed? For example, where do users tend to drop off, or what features do they use most versus least?",
    "Great insights. I can now synthesize this into structured research findings. Hit Generate when ready, or share any additional data points.",
  ],
  2: [
    "Based on what you've shared, I can already see some distinct user types emerging. Can you tell me more about the primary user — what are their main goals when they interact with your service?",
    "That's helpful. Are there secondary users or stakeholders who interact with the service differently? Think about people with different levels of experience, different needs, or different contexts of use.",
    "I have a good understanding of your user segments now. I can generate persona profiles that capture these distinct types. Click Generate when you're ready.",
  ],
  3: [
    "Let's walk through the journey step by step. Starting from the very beginning — how do customers first become aware of or discover your service? What triggers their interest?",
    "Good. Now let's move further along. After they decide to try the service, what does their first experience look like? Walk me through the key touchpoints and any friction points.",
    "I can see the full arc of the journey now — from discovery through to ongoing use. I'm ready to map this out with stages, touchpoints, pain points, and emotional states. Hit Generate to create the journey map.",
  ],
};

/* ---------- Validation ---------- */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const requestSchema = z.object({
  projectId: z.string(),
  phase: z.number().min(0).max(3),
  messages: z.array(messageSchema),
  previousOutputs: z.record(z.string(), z.any()).optional(),
  action: z.enum(["chat", "generate"]),
});

/* ---------- Route handler ---------- */

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

    const { projectId, phase, messages, previousOutputs, action } = parsed.data;

    // Build context from previous phases
    const contextParts: string[] = [];
    if (previousOutputs?.problem) {
      contextParts.push(
        `Previous Phase — Problem Statement:\n${JSON.stringify(previousOutputs.problem, null, 2)}`
      );
    }
    if (previousOutputs?.context) {
      contextParts.push(
        `Previous Phase — Research Context:\n${JSON.stringify(previousOutputs.context, null, 2)}`
      );
    }
    if (previousOutputs?.personas) {
      contextParts.push(
        `Previous Phase — Personas:\n${JSON.stringify(previousOutputs.personas, null, 2)}`
      );
    }
    const previousContext = contextParts.join("\n\n---\n\n");

    /* ====== CHAT action ====== */
    if (action === "chat") {
      if (isMockMode()) {
        const phaseResponses = MOCK_PHASE_CHAT[phase] || MOCK_PHASE_CHAT[0];
        const index = Math.min(
          Math.floor(messages.length / 2),
          phaseResponses.length - 1
        );
        const mockText = phaseResponses[index];

        return new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              for (const char of mockText) {
                controller.enqueue(encoder.encode(char));
                await new Promise((resolve) => setTimeout(resolve, 15));
              }
              controller.close();
            },
          }),
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          }
        );
      }

      // Real AI chat
      const systemPrompt = previousContext
        ? `${PHASE_SYSTEM_PROMPTS[phase]}\n\n--- Context from previous phases ---\n${previousContext}`
        : PHASE_SYSTEM_PROMPTS[phase];

      const formattedMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const client = getAnthropicClient();
      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: formattedMessages,
      });

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const event of stream) {
                if (
                  event.type === "content_block_delta" &&
                  event.delta.type === "text_delta"
                ) {
                  controller.enqueue(
                    new TextEncoder().encode(event.delta.text)
                  );
                }
              }
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    /* ====== GENERATE action ====== */
    if (action === "generate") {
      let output: any;

      if (isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        switch (phase) {
          case 0:
            output = MOCK_PROBLEM_STATEMENT;
            break;
          case 1:
            output = {
              themes: MOCK_SYNTHESIS.patterns.map((p) => ({
                label: p.label,
                description: p.description,
                frequency: p.frequency,
              })),
              pain_points: MOCK_SYNTHESIS.critical_pain_points.map((pp) => ({
                description: pp,
                severity: "high" as const,
                stage_suggestion: "Onboarding",
              })),
              insights: MOCK_SYNTHESIS.opportunities.map((o) => ({
                content: o,
                type: "opportunity" as const,
                confidence: 0.8,
              })),
            };
            break;
          case 2:
            output = {
              personas: [MOCK_PERSONA],
            };
            break;
          case 3:
            output = MOCK_MAP_GENERATION;
            break;
        }
      } else {
        // Real AI generation
        const systemPrompt = previousContext
          ? `${PHASE_SYSTEM_PROMPTS[phase]}\n\n--- Context from previous phases ---\n${previousContext}`
          : PHASE_SYSTEM_PROMPTS[phase];

        const conversationContext = messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n\n");

        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Here is our conversation so far:\n\n${conversationContext}\n\n---\n\n${PHASE_GENERATE_PROMPTS[phase]}\n\nReturn ONLY the JSON object, no markdown fences or extra text.`,
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        const text = textBlock?.text || "";

        // Parse JSON — handle possible markdown fences
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return NextResponse.json(
            { error: "Failed to parse AI response as JSON" },
            { status: 500 }
          );
        }
        output = JSON.parse(jsonMatch[0]);
      }

      // Save to database
      try {
        const supabase = await createClient();

        switch (phase) {
          case 0: {
            // Delete any existing problem statement for this project, then insert
            await supabase
              .from("problem_statements")
              .delete()
              .eq("project_id", projectId);

            const { error } = await supabase
              .from("problem_statements")
              .insert({
                project_id: projectId,
                statement: output.statement,
                context: output.context,
                impact: output.impact,
                current_state: output.current_state,
                desired_state: output.desired_state,
                constraints: output.constraints || [],
                assumptions: output.assumptions || [],
                is_ai_refined: true,
              });
            if (error)
              console.error("Error saving problem statement:", error);
            break;
          }

          case 1: {
            // Insert findings
            const themes = output.themes || [];
            const painPoints = output.pain_points || [];
            const insights = output.insights || [];

            const findingsToInsert = [
              ...themes.map((t: any) => ({
                project_id: projectId,
                finding_type: "insight" as const,
                content: `${t.label}: ${t.description}`,
                theme: t.label,
              })),
              ...painPoints.map((pp: any) => ({
                project_id: projectId,
                finding_type: "pain_point" as const,
                content: pp.description,
                theme: pp.stage_suggestion || null,
              })),
              ...insights.map((ins: any) => ({
                project_id: projectId,
                finding_type: (ins.type || "insight") as any,
                content: ins.content,
                sentiment: ins.confidence || null,
              })),
            ];

            if (findingsToInsert.length > 0) {
              const { error } = await supabase
                .from("findings")
                .insert(findingsToInsert);
              if (error) console.error("Error saving findings:", error);
            }
            break;
          }

          case 2: {
            // Insert personas
            const personas = output.personas || [output];
            for (const persona of personas) {
              const { error } = await supabase.from("personas").insert({
                project_id: projectId,
                name: persona.name,
                role: persona.role,
                bio: persona.bio,
                goals: persona.goals || [],
                frustrations: persona.frustrations || [],
                behaviors: persona.behaviors || [],
                quotes: persona.quotes || [],
                is_ai_generated: true,
              });
              if (error) console.error("Error saving persona:", error);
            }
            break;
          }

          case 3: {
            // Create journey map + stages + lanes + nodes + edges
            const { data: newMap, error: mapError } = await supabase
              .from("journey_maps")
              .insert({
                project_id: projectId,
                name: "AI-Generated Journey Map",
                mode: "blueprint",
              })
              .select()
              .single();

            if (mapError || !newMap) {
              console.error("Error creating journey map:", mapError);
              break;
            }

            output.journey_map_id = newMap.id;

            // Insert stages
            const stagesToInsert = (output.stages || []).map(
              (stage: any, i: number) => ({
                journey_map_id: newMap.id,
                label: stage.label,
                description: stage.description || null,
                sort_order: i,
                color: "#E2E8F0",
              })
            );

            const { data: insertedStages, error: stagesError } = await supabase
              .from("stages")
              .insert(stagesToInsert)
              .select();

            if (stagesError || !insertedStages) {
              console.error("Error creating stages:", stagesError);
              break;
            }

            // Insert default lanes
            const defaultLanes = [
              { lane_type: "customer_actions", label: "Customer Actions", sort_order: 0 },
              { lane_type: "frontstage", label: "Frontstage", sort_order: 1 },
              { lane_type: "backstage", label: "Backstage", sort_order: 2 },
              { lane_type: "support_processes", label: "Support Processes", sort_order: 3 },
              { lane_type: "physical_evidence", label: "Physical Evidence", sort_order: 4 },
              { lane_type: "emotional_journey", label: "Emotional Journey", sort_order: 5 },
            ];

            await supabase.from("lanes").insert(
              defaultLanes.map((l) => ({ journey_map_id: newMap.id, ...l }))
            );

            // Insert nodes with positions spread across stages and lanes
            const laneYPositions: Record<string, number> = {
              customer_actions: 80,
              frontstage: 260,
              backstage: 440,
              support_processes: 620,
              physical_evidence: 800,
              emotional_journey: 980,
            };

            const nodesToInsert = (output.nodes || []).map((node: any, i: number) => {
              const stageX = 200 + (node.stage_index || 0) * 300;
              const laneY = laneYPositions[node.lane] || 260;
              // Offset nodes within same stage/lane to avoid overlap
              const offsetX = (i % 3) * 40;
              const offsetY = Math.floor(i / 5) * 30;

              return {
                journey_map_id: newMap.id,
                stage_id: insertedStages[node.stage_index]?.id || null,
                node_type: node.type,
                label: node.label,
                description: node.description || null,
                position_x: stageX + offsetX,
                position_y: laneY + offsetY,
                sentiment: node.sentiment || null,
                severity: node.severity || null,
                metadata: {},
              };
            });

            const { data: insertedNodes, error: nodesError } = await supabase
              .from("map_nodes")
              .insert(nodesToInsert)
              .select();

            if (nodesError || !insertedNodes) {
              console.error("Error creating nodes:", nodesError);
              break;
            }

            // Insert edges
            const edgesToInsert = (output.connections || [])
              .filter((conn: any) =>
                insertedNodes[conn.from_index] && insertedNodes[conn.to_index]
              )
              .map((conn: any) => ({
                journey_map_id: newMap.id,
                source_node_id: insertedNodes[conn.from_index].id,
                target_node_id: insertedNodes[conn.to_index].id,
                edge_type: conn.type || "flow",
                animated: false,
              }));

            if (edgesToInsert.length > 0) {
              const { error: edgesError } = await supabase
                .from("map_edges")
                .insert(edgesToInsert);
              if (edgesError)
                console.error("Error creating edges:", edgesError);
            }

            break;
          }
        }
      } catch (dbError) {
        console.error("Database save error:", dbError);
        // Don't fail the request — return the output even if DB save fails
      }

      return NextResponse.json(output);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Wizard error:", error);
    return NextResponse.json(
      {
        error: "Wizard request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
