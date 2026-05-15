export const DEFAULT_STAGES = [
  { label: "Awareness", color: "#5e6ad2", sort_order: 0 },
  { label: "Consideration", color: "#7c6dd8", sort_order: 1 },
  { label: "Decision", color: "#5e6ad2", sort_order: 2 },
  { label: "Onboarding", color: "#7c6dd8", sort_order: 3 },
  { label: "Retention", color: "#5e6ad2", sort_order: 4 },
];

// NNGroup standard service blueprint lanes with lines of visibility
// Line of Interaction sits between Customer Actions and Frontstage
// Line of Visibility sits between Frontstage and Backstage
// Line of Internal Interaction sits between Backstage and Support Processes
export const DEFAULT_LANES = [
  {
    lane_type: "physical_evidence" as const,
    label: "Physical / Digital Evidence",
    sort_order: 0,
    color: "rgba(94, 106, 210, 0.04)",
  },
  {
    lane_type: "customer_actions" as const,
    label: "Customer Actions",
    sort_order: 1,
    color: "rgba(94, 106, 210, 0.06)",
  },
  // --- Line of Interaction ---
  {
    lane_type: "frontstage" as const,
    label: "Frontstage Actions",
    sort_order: 2,
    color: "rgba(94, 106, 210, 0.04)",
  },
  // --- Line of Visibility ---
  {
    lane_type: "backstage" as const,
    label: "Backstage Actions",
    sort_order: 3,
    color: "rgba(140, 140, 160, 0.04)",
  },
  // --- Line of Internal Interaction ---
  {
    lane_type: "support_processes" as const,
    label: "Support Processes",
    sort_order: 4,
    color: "rgba(140, 140, 160, 0.03)",
  },
];

// Lines of visibility positions (between which lane sort_orders)
export const LINES_OF_VISIBILITY = [
  { after_sort_order: 1, label: "Line of Interaction", style: "solid" as const },
  { after_sort_order: 2, label: "Line of Visibility", style: "dashed" as const },
  { after_sort_order: 3, label: "Line of Internal Interaction", style: "dotted" as const },
];

export const STAGE_WIDTH = 280;
export const LANE_HEIGHT = 180;
export const STAGE_HEADER_HEIGHT = 48;
export const LANE_LABEL_WIDTH = 180;
export const LANE_GAP = 2;
export const STAGE_GAP = 2;
