import { TouchpointNode } from "./TouchpointNode";
import { PainPointNode } from "./PainPointNode";
import { OpportunityNode } from "./OpportunityNode";
import { EvidenceNode } from "./EvidenceNode";
import { ActionNode } from "./ActionNode";
import { EmotionNode } from "./EmotionNode";
import { NoteNode } from "./NoteNode";
import { MomentOfTruthNode } from "./MomentOfTruthNode";

export const nodeTypes = {
  touchpoint: TouchpointNode,
  pain_point: PainPointNode,
  opportunity: OpportunityNode,
  evidence_item: EvidenceNode,
  action: ActionNode,
  emotion: EmotionNode,
  note: NoteNode,
  moment_of_truth: MomentOfTruthNode,
} as const;

export {
  TouchpointNode,
  PainPointNode,
  OpportunityNode,
  EvidenceNode,
  ActionNode,
  EmotionNode,
  NoteNode,
  MomentOfTruthNode,
};
