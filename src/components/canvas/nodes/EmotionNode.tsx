"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Heart } from "lucide-react";

type EmotionNodeData = {
  label: string;
  description?: string;
  sentiment?: number; // -1 to 1 scale
};

function getSentimentColor(sentiment: number | undefined) {
  if (sentiment === undefined) return { text: "text-pink-400", bg: "bg-pink-400/15" };
  if (sentiment >= 0.5) return { text: "text-emerald-400", bg: "bg-emerald-400/15" };
  if (sentiment >= 0) return { text: "text-yellow-400", bg: "bg-yellow-400/15" };
  if (sentiment >= -0.5) return { text: "text-orange-400", bg: "bg-orange-400/15" };
  return { text: "text-rose-400", bg: "bg-rose-400/15" };
}

function getSentimentLabel(sentiment: number | undefined) {
  if (sentiment === undefined) return null;
  if (sentiment >= 0.5) return "Positive";
  if (sentiment >= 0) return "Neutral";
  if (sentiment >= -0.5) return "Negative";
  return "Very Negative";
}

function EmotionNodeComponent({ data, selected }: NodeProps) {
  const { label, description, sentiment } = data as EmotionNodeData;
  const color = getSentimentColor(sentiment);
  const sentimentLabel = getSentimentLabel(sentiment);

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
        <div
          className={`w-6 h-6 rounded-md ${color.bg} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <Heart className={`w-3.5 h-3.5 ${color.text}`} />
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
          {sentimentLabel && (
            <span
              className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full ${color.bg} ${color.text} font-medium`}
            >
              {sentimentLabel} ({sentiment!.toFixed(1)})
            </span>
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

export const EmotionNode = memo(EmotionNodeComponent);
