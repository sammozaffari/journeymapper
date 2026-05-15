"use client";

import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Node } from "@xyflow/react";

interface NodeDetailPanelProps {
  nodeId: string;
  nodes: Node[];
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const severityOptions = [
  { value: "low", label: "Low", color: "text-emerald-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "critical", label: "Critical", color: "text-rose-400" },
];

const nodeTypeLabels: Record<string, string> = {
  touchpoint: "Touchpoint",
  pain_point: "Pain Point",
  opportunity: "Opportunity",
  moment_of_truth: "Moment of Truth",
  evidence_item: "Evidence",
  action: "Action",
  emotion: "Emotion",
  note: "Note",
};

export function NodeDetailPanel({
  nodeId,
  nodes,
  onUpdate,
  onClose,
  onDelete,
}: NodeDetailPanelProps) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const data = node.data as Record<string, unknown>;
  const nodeType = node.type || "touchpoint";

  return (
    <div className="w-72 border-l border-border/50 bg-card/95 backdrop-blur-sm flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {nodeTypeLabels[nodeType] || "Node"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Label
          </Label>
          <Input
            value={(data.label as string) || ""}
            onChange={(e) => onUpdate(nodeId, { label: e.target.value })}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </Label>
          <Textarea
            value={(data.description as string) || ""}
            onChange={(e) => onUpdate(nodeId, { description: e.target.value })}
            rows={3}
            className="text-sm resize-none"
            placeholder="Add a description..."
          />
        </div>

        {/* Severity — for pain points and moments of truth */}
        {(nodeType === "pain_point" || nodeType === "moment_of_truth") && (
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Severity
            </Label>
            <select
              value={(data.severity as string) || "medium"}
              onChange={(e) => onUpdate(nodeId, { severity: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sentiment — for emotion nodes */}
        {nodeType === "emotion" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sentiment
            </Label>
            <div className="space-y-1">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={(data.sentiment as number) || 0}
                onChange={(e) =>
                  onUpdate(nodeId, { sentiment: parseFloat(e.target.value) })
                }
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={() => onDelete(nodeId)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
