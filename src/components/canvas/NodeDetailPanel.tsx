"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Link2, FileText, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import type { Node } from "@xyflow/react";

interface Finding {
  id: string;
  finding_type: string;
  content: string;
  theme: string | null;
  sentiment: number | null;
}

interface NodeDetailPanelProps {
  nodeId: string;
  nodes: Node[];
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const severityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
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

const findingTypeColors: Record<string, string> = {
  pain_point: "bg-rose-400/10 text-rose-400",
  opportunity: "bg-emerald-400/10 text-emerald-400",
  insight: "bg-brand/10 text-brand",
  need: "bg-sky-400/10 text-sky-400",
  behavior: "bg-violet-400/10 text-violet-400",
  quote: "bg-amber-400/10 text-amber-400",
};

export function NodeDetailPanel({
  nodeId,
  nodes,
  onUpdate,
  onClose,
  onDelete,
}: NodeDetailPanelProps) {
  const node = nodes.find((n) => n.id === nodeId);
  const [linkedFindings, setLinkedFindings] = useState<Finding[]>([]);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const supabase = createClient();

  // Load linked findings when node changes
  useEffect(() => {
    if (!nodeId) return;

    async function loadLinkedFindings() {
      setLoadingFindings(true);

      // Get finding IDs linked to this node
      const { data: links } = await supabase
        .from("finding_node_links")
        .select("finding_id")
        .eq("node_id", nodeId);

      if (links && links.length > 0) {
        const findingIds = links.map((l) => l.finding_id);
        const { data: findings } = await supabase
          .from("findings")
          .select("id, finding_type, content, theme, sentiment")
          .in("id", findingIds);

        setLinkedFindings(findings || []);
      } else {
        setLinkedFindings([]);
      }

      setLoadingFindings(false);
    }

    loadLinkedFindings();
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function unlinkFinding(findingId: string) {
    await supabase
      .from("finding_node_links")
      .delete()
      .eq("finding_id", findingId)
      .eq("node_id", nodeId);

    setLinkedFindings((prev) => prev.filter((f) => f.id !== findingId));
  }

  if (!node) return null;

  const data = node.data as Record<string, unknown>;
  const nodeType = node.type || "touchpoint";

  return (
    <div className="w-80 border-l border-border/50 bg-card/95 backdrop-blur-sm flex flex-col shrink-0">
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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Label */}
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

          {/* Description */}
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

          {/* Linked Findings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Linked Findings
              </Label>
              {linkedFindings.length > 0 && (
                <Badge variant="secondary" className="text-[9px]">
                  {linkedFindings.length}
                </Badge>
              )}
            </div>

            {loadingFindings ? (
              <div className="text-xs text-muted-foreground/50 py-2">
                Loading...
              </div>
            ) : linkedFindings.length === 0 ? (
              <div className="text-xs text-muted-foreground/40 py-3 text-center border border-dashed border-border/30 rounded-md">
                No linked findings yet
              </div>
            ) : (
              <div className="space-y-1.5">
                {linkedFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="group p-2.5 rounded-md bg-background/50 border border-border/20 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase tracking-wider shrink-0 ${
                          findingTypeColors[finding.finding_type] || "bg-muted"
                        }`}
                      >
                        {finding.finding_type}
                      </Badge>
                      <button
                        onClick={() => unlinkFinding(finding.id)}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                        title="Unlink finding"
                      >
                        <Unlink className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                      {finding.content}
                    </p>
                    {finding.theme && (
                      <p className="text-[10px] text-muted-foreground/50">
                        {finding.theme}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

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
