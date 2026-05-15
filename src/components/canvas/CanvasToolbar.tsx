"use client";

import {
  MousePointer2,
  Circle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Play,
  Heart,
  StickyNote,
  Star,
  Link2,
  Undo,
  Redo,
  Settings,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const tools = [
  { id: "select" as const, icon: MousePointer2, label: "Select", nodeType: null },
  { id: "add-touchpoint" as const, icon: Circle, label: "Touchpoint", nodeType: "touchpoint" },
  { id: "add-pain-point" as const, icon: AlertTriangle, label: "Pain Point", nodeType: "pain_point" },
  { id: "add-opportunity" as const, icon: Lightbulb, label: "Opportunity", nodeType: "opportunity" },
  { id: "add-evidence" as const, icon: FileText, label: "Evidence", nodeType: "evidence_item" },
  { id: "add-action" as const, icon: Play, label: "Action", nodeType: "action" },
  { id: "add-emotion" as const, icon: Heart, label: "Emotion", nodeType: "emotion" },
  { id: "add-note" as const, icon: StickyNote, label: "Note", nodeType: "note" },
  { id: "connect" as const, icon: Link2, label: "Connect", nodeType: null },
] as const;

const toolColors: Record<string, string> = {
  "add-touchpoint": "text-brand",
  "add-pain-point": "text-rose-400",
  "add-opportunity": "text-emerald-400",
  "add-evidence": "text-sky-400",
  "add-action": "text-violet-400",
  "add-emotion": "text-pink-400",
  "add-note": "text-yellow-400/70",
};

interface CanvasToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onManageStages?: () => void;
}

export function CanvasToolbar({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onManageStages,
}: CanvasToolbarProps) {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  function handleDragStart(event: React.DragEvent, nodeType: string) {
    event.dataTransfer.setData("application/reactflow-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="w-12 border-r border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center py-3 gap-1 shrink-0">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        const color = toolColors[tool.id];

        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-brand/15 text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              onClick={() => setActiveTool(tool.id)}
              draggable={!!tool.nodeType}
              onDragStart={(e) => tool.nodeType && handleDragStart(e, tool.nodeType)}
            >
              <tool.icon className={cn("w-4 h-4", isActive && color)} />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {tool.label}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <div className="w-6 border-t border-border/30 my-2" />

      {/* Mode toggle */}
      <Tooltip>
        <TooltipTrigger
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          onClick={() => {
            const mode = useUIStore.getState().canvasMode;
            useUIStore.getState().setCanvasMode(mode === "blueprint" ? "freeform" : "blueprint");
          }}
        >
          <Star className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Toggle Mode
        </TooltipContent>
      </Tooltip>

      <div className="w-6 border-t border-border/30 my-2" />

      {/* Undo */}
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            canUndo
              ? "text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Undo
        </TooltipContent>
      </Tooltip>

      {/* Redo */}
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            canRedo
              ? "text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Redo
        </TooltipContent>
      </Tooltip>

      {/* Manage Stages */}
      <Tooltip>
        <TooltipTrigger
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
          onClick={onManageStages}
        >
          <Settings className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Manage Stages & Lanes
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
