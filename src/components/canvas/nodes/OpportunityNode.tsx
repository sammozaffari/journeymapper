"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Lightbulb } from "lucide-react";

type OpportunityNodeData = {
  label: string;
  description?: string;
};

function OpportunityNodeComponent({ data, selected }: NodeProps) {
  const { label, description } = data as OpportunityNodeData;

  return (
    <div
      className={`relative px-3 py-2 rounded-lg border min-w-[140px] max-w-[200px] transition-all duration-150 ${
        selected
          ? "border-amber ring-2 ring-amber/20 shadow-lg shadow-amber/10"
          : "border-border/50 hover:border-border"
      } bg-card`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-md bg-emerald-400/15 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-tight truncate">
            {label}
          </p>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
    </div>
  );
}

export const OpportunityNode = memo(OpportunityNodeComponent);
