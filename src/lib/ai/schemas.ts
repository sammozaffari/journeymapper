import { z } from "zod";

// Research extraction output
export const extractionSchema = z.object({
  themes: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      frequency: z.number().optional(),
    })
  ),
  quotes: z.array(
    z.object({
      text: z.string(),
      speaker: z.string().optional(),
      sentiment: z.number().min(-1).max(1),
    })
  ),
  pain_points: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      stage_suggestion: z.string().optional(),
    })
  ),
  insights: z.array(
    z.object({
      content: z.string(),
      type: z.enum(["insight", "need", "behavior", "opportunity"]),
      confidence: z.number().min(0).max(1),
    })
  ),
  overall_sentiment: z.number().min(-1).max(1),
});

// Research synthesis output
export const synthesisSchema = z.object({
  patterns: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      frequency: z.number(),
      sentiment: z.number().min(-1).max(1),
    })
  ),
  persona_suggestions: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
      frustrations: z.array(z.string()),
      behaviors: z.array(z.string()),
      bio: z.string(),
    })
  ),
  journey_stages: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      key_touchpoints: z.array(z.string()),
      pain_points: z.array(z.string()),
      opportunities: z.array(z.string()),
      emotional_state: z.number().min(-1).max(1),
    })
  ),
  critical_pain_points: z.array(z.string()),
  opportunities: z.array(z.string()),
});

// Persona generation output
export const personaSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  demographics: z.object({
    age_range: z.string().optional(),
    location: z.string().optional(),
    tech_savviness: z.string().optional(),
  }),
  goals: z.array(z.string()),
  frustrations: z.array(z.string()),
  behaviors: z.array(z.string()),
  quotes: z.array(z.string()),
});

// Journey map generation output
export const mapGenerationSchema = z.object({
  stages: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
    })
  ),
  nodes: z.array(
    z.object({
      type: z.enum([
        "touchpoint",
        "pain_point",
        "opportunity",
        "moment_of_truth",
        "evidence_item",
        "action",
        "emotion",
        "note",
      ]),
      label: z.string(),
      description: z.string(),
      stage_index: z.number(),
      lane: z.enum([
        "customer_actions",
        "frontstage",
        "backstage",
        "support_processes",
        "physical_evidence",
        "emotional_journey",
      ]),
      sentiment: z.number().min(-1).max(1).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    })
  ),
  connections: z.array(
    z.object({
      from_index: z.number(),
      to_index: z.number(),
      type: z.enum(["flow", "dependency", "interaction"]),
    })
  ),
});

// Problem statement refinement output
export const problemStatementSchema = z.object({
  statement: z.string(),
  context: z.string(),
  impact: z.string(),
  current_state: z.string(),
  desired_state: z.string(),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
export type SynthesisResult = z.infer<typeof synthesisSchema>;
export type PersonaResult = z.infer<typeof personaSchema>;
export type MapGenerationResult = z.infer<typeof mapGenerationSchema>;
export type ProblemStatementResult = z.infer<typeof problemStatementSchema>;
