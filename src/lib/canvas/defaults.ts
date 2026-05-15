export const DEFAULT_STAGES = [
  { label: "Awareness", color: "#3b82f6", sort_order: 0 },
  { label: "Consideration", color: "#8b5cf6", sort_order: 1 },
  { label: "Decision", color: "#f59e0b", sort_order: 2 },
  { label: "Onboarding", color: "#10b981", sort_order: 3 },
  { label: "Retention", color: "#ec4899", sort_order: 4 },
];

export const DEFAULT_LANES = [
  {
    lane_type: "customer_actions" as const,
    label: "Customer Actions",
    sort_order: 0,
    color: "oklch(0.75 0.15 70 / 0.08)",
  },
  {
    lane_type: "frontstage" as const,
    label: "Frontstage",
    sort_order: 1,
    color: "oklch(0.6 0.12 200 / 0.06)",
  },
  {
    lane_type: "backstage" as const,
    label: "Backstage",
    sort_order: 2,
    color: "oklch(0.5 0.1 280 / 0.05)",
  },
  {
    lane_type: "support_processes" as const,
    label: "Support Processes",
    sort_order: 3,
    color: "oklch(0.5 0.08 160 / 0.04)",
  },
  {
    lane_type: "physical_evidence" as const,
    label: "Physical Evidence",
    sort_order: 4,
    color: "oklch(0.6 0.06 40 / 0.04)",
  },
  {
    lane_type: "emotional_journey" as const,
    label: "Emotional Journey",
    sort_order: 5,
    color: "oklch(0.65 0.15 350 / 0.05)",
  },
];

export const STAGE_WIDTH = 280;
export const LANE_HEIGHT = 180;
export const STAGE_HEADER_HEIGHT = 48;
export const LANE_LABEL_WIDTH = 160;
export const LANE_GAP = 2;
export const STAGE_GAP = 2;
