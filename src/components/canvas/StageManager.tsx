"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { DEFAULT_LANES } from "@/lib/canvas/defaults";

interface Stage {
  id: string;
  label: string;
  sort_order: number;
  color: string;
}

interface Lane {
  id: string;
  lane_type: string;
  label: string;
  sort_order: number;
  color: string;
  visible?: boolean;
}

interface StageManagerProps {
  stages: Stage[];
  lanes: Lane[];
  onStagesChange: (stages: Stage[]) => void;
  onLanesChange: (lanes: Lane[]) => void;
  onClose: () => void;
}

const DEFAULT_LANE_TYPES: Set<string> = new Set(DEFAULT_LANES.map((l) => l.lane_type));

export function StageManager({
  stages,
  lanes,
  onStagesChange,
  onLanesChange,
  onClose,
}: StageManagerProps) {
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [confirmDeleteStageId, setConfirmDeleteStageId] = useState<string | null>(null);

  // --- Stage operations ---

  function handleStageLabel(id: string, label: string) {
    onStagesChange(stages.map((s) => (s.id === id ? { ...s, label } : s)));
    setEditingStageId(null);
  }

  function handleAddStage() {
    const maxOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.sort_order)) : -1;
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      label: "New Stage",
      sort_order: maxOrder + 1,
      color: "#5e6ad2",
    };
    onStagesChange([...stages, newStage]);
  }

  function handleDeleteStage(id: string) {
    const updated = stages
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, sort_order: i }));
    onStagesChange(updated);
    setConfirmDeleteStageId(null);
  }

  function handleMoveStage(id: string, direction: "up" | "down") {
    const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((s) => s.id === id);
    if (
      (direction === "up" && idx <= 0) ||
      (direction === "down" && idx >= sorted.length - 1)
    )
      return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = sorted[idx].sort_order;
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: temp };
    onStagesChange(sorted);
  }

  // --- Lane operations ---

  function handleLaneLabel(id: string, label: string) {
    onLanesChange(lanes.map((l) => (l.id === id ? { ...l, label } : l)));
    setEditingLaneId(null);
  }

  function handleToggleLaneVisibility(id: string) {
    onLanesChange(
      lanes.map((l) =>
        l.id === id ? { ...l, visible: l.visible === false ? true : false } : l
      )
    );
  }

  function handleAddLane() {
    const maxOrder = lanes.length > 0 ? Math.max(...lanes.map((l) => l.sort_order)) : -1;
    const newLane: Lane = {
      id: `lane-${Date.now()}`,
      lane_type: "custom",
      label: "Custom Lane",
      sort_order: maxOrder + 1,
      color: "rgba(140, 140, 160, 0.03)",
    };
    onLanesChange([...lanes, newLane]);
  }

  function handleDeleteLane(id: string) {
    const updated = lanes
      .filter((l) => l.id !== id)
      .map((l, i) => ({ ...l, sort_order: i }));
    onLanesChange(updated);
  }

  function handleMoveLane(id: string, direction: "up" | "down") {
    const sorted = [...lanes].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((l) => l.id === id);
    if (
      (direction === "up" && idx <= 0) ||
      (direction === "down" && idx >= sorted.length - 1)
    )
      return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = sorted[idx].sort_order;
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: temp };
    onLanesChange(sorted);
  }

  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const sortedLanes = [...lanes].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Stages & Lanes</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-8">
          {/* Stages section */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Stages
            </h3>
            <div className="space-y-1.5">
              {sortedStages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-1.5 group rounded-md border border-border/30 bg-card/50 px-2 py-1.5"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

                  {editingStageId === stage.id ? (
                    <input
                      autoFocus
                      defaultValue={stage.label}
                      className="flex-1 text-sm bg-transparent border-b border-brand/40 outline-none px-1 py-0.5"
                      onBlur={(e) => handleStageLabel(stage.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleStageLabel(stage.id, e.currentTarget.value);
                        }
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm cursor-pointer hover:text-brand transition-colors truncate"
                      onClick={() => setEditingStageId(stage.id)}
                    >
                      {stage.label}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => handleMoveStage(stage.id, "up")}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => handleMoveStage(stage.id, "down")}
                      disabled={idx === sortedStages.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {confirmDeleteStageId === stage.id ? (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                          onClick={() => handleDeleteStage(stage.id)}
                        >
                          Delete
                        </button>
                        <button
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => setConfirmDeleteStageId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="p-1 rounded hover:bg-rose-400/10 text-muted-foreground hover:text-rose-400"
                        onClick={() => setConfirmDeleteStageId(stage.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-brand hover:text-brand/80 w-full justify-start gap-1.5"
              onClick={handleAddStage}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stage
            </Button>
          </div>

          {/* Lanes section */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Lanes
            </h3>
            <div className="space-y-1.5">
              {sortedLanes.map((lane, idx) => {
                const isDefault = DEFAULT_LANE_TYPES.has(lane.lane_type);
                const isVisible = lane.visible !== false;

                return (
                  <div
                    key={lane.id}
                    className="flex items-center gap-1.5 group rounded-md border border-border/30 bg-card/50 px-2 py-1.5"
                  >
                    <button
                      className="p-0.5 rounded hover:bg-accent/50 text-muted-foreground/60 hover:text-foreground shrink-0"
                      onClick={() => handleToggleLaneVisibility(lane.id)}
                    >
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />
                      )}
                    </button>

                    {editingLaneId === lane.id ? (
                      <input
                        autoFocus
                        defaultValue={lane.label}
                        className="flex-1 text-sm bg-transparent border-b border-brand/40 outline-none px-1 py-0.5"
                        onBlur={(e) => handleLaneLabel(lane.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleLaneLabel(lane.id, e.currentTarget.value);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm cursor-pointer hover:text-brand transition-colors truncate ${
                          !isVisible ? "opacity-40" : ""
                        }`}
                        onClick={() => setEditingLaneId(lane.id)}
                      >
                        {lane.label}
                      </span>
                    )}

                    {isDefault && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 shrink-0">
                        default
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => handleMoveLane(lane.id, "up")}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => handleMoveLane(lane.id, "down")}
                        disabled={idx === sortedLanes.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      {!isDefault && (
                        <button
                          className="p-1 rounded hover:bg-rose-400/10 text-muted-foreground hover:text-rose-400"
                          onClick={() => handleDeleteLane(lane.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-brand hover:text-brand/80 w-full justify-start gap-1.5"
              onClick={handleAddLane}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Lane
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
