"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Target,
  Frown,
  Lightbulb,
  UserCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Pencil,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PhaseOutputProps {
  phase: number;
  output: any;
  onEdit?: (updatedOutput: any) => void;
}

export function PhaseOutput({ phase, output, onEdit }: PhaseOutputProps) {
  switch (phase) {
    case 0:
      return <ProblemOutput data={output} onEdit={onEdit} />;
    case 1:
      return <ContextOutput data={output} />;
    case 2:
      return <PersonasOutput data={output} onEdit={onEdit} />;
    case 3:
      return <JourneyOutput data={output} />;
    default:
      return null;
  }
}

/* ---------- Editable field helper ---------- */

function EditableText({
  value,
  onChange,
  multiline = false,
  className,
}: {
  value: string;
  onChange?: (val: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!onChange) {
    return <span className={className}>{value}</span>;
  }

  if (editing) {
    return (
      <div className="flex gap-1.5 items-start">
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm min-h-[60px] resize-none flex-1"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-sm h-8 flex-1"
            autoFocus
          />
        )}
        <button
          onClick={() => {
            onChange(draft);
            setEditing(false);
          }}
          className="p-1 rounded hover:bg-accent shrink-0 mt-0.5"
        >
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        </button>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "group/edit cursor-pointer hover:bg-accent/30 rounded px-1 -mx-1 inline-flex items-start gap-1",
        className
      )}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
      <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-40 shrink-0 mt-0.5" />
    </span>
  );
}

/* ---------- Phase 0: Problem ---------- */

function ProblemOutput({
  data,
  onEdit,
}: {
  data: any;
  onEdit?: (updated: any) => void;
}) {
  function handleFieldEdit(field: string, value: string) {
    onEdit?.({ ...data, [field]: value });
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Problem Statement
          </p>
          <EditableText
            value={data.statement}
            onChange={onEdit ? (v) => handleFieldEdit("statement", v) : undefined}
            multiline
            className="text-sm leading-relaxed font-medium"
          />
        </div>

        {data.context && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Context
            </p>
            <EditableText
              value={data.context}
              onChange={onEdit ? (v) => handleFieldEdit("context", v) : undefined}
              multiline
              className="text-sm text-muted-foreground leading-relaxed"
            />
          </div>
        )}

        {data.impact && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Impact
            </p>
            <EditableText
              value={data.impact}
              onChange={onEdit ? (v) => handleFieldEdit("impact", v) : undefined}
              multiline
              className="text-sm text-muted-foreground leading-relaxed"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.current_state && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-rose-400/80 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3" />
                Current State
              </p>
              <EditableText
                value={data.current_state}
                onChange={
                  onEdit
                    ? (v) => handleFieldEdit("current_state", v)
                    : undefined
                }
                multiline
                className="text-xs text-muted-foreground leading-relaxed"
              />
            </div>
          )}
          {data.desired_state && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/80 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Desired State
              </p>
              <EditableText
                value={data.desired_state}
                onChange={
                  onEdit
                    ? (v) => handleFieldEdit("desired_state", v)
                    : undefined
                }
                multiline
                className="text-xs text-muted-foreground leading-relaxed"
              />
            </div>
          )}
        </div>

        {data.constraints?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Constraints
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.constraints.map((c: string, i: number) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.assumptions?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Assumptions
            </p>
            <ul className="space-y-1">
              {data.assumptions.map((a: string, i: number) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <Minus className="w-3 h-3 mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Phase 1: Context ---------- */

function ContextOutput({ data }: { data: any }) {
  const themes = data.themes || data.patterns || [];
  const painPoints = data.pain_points || data.critical_pain_points || [];
  const insights = data.insights || data.opportunities || [];

  return (
    <div className="space-y-4">
      {themes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3" />
            Themes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themes.map((theme: any, i: number) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{theme.label}</p>
                    {theme.frequency && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-normal"
                      >
                        {theme.frequency}x
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {theme.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {painPoints.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Pain Points
          </p>
          <div className="space-y-1.5">
            {(Array.isArray(painPoints) ? painPoints : []).map(
              (pp: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      typeof pp === "string"
                        ? "bg-rose-400"
                        : pp.severity === "critical"
                          ? "bg-rose-500"
                          : pp.severity === "high"
                            ? "bg-amber-500"
                            : "bg-muted-foreground/40"
                    )}
                  />
                  <span>{typeof pp === "string" ? pp : pp.description}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            Insights
          </p>
          <div className="space-y-1.5">
            {(Array.isArray(insights) ? insights : []).map(
              (ins: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-brand/60" />
                  <span>
                    {typeof ins === "string" ? ins : ins.content || ins}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Phase 2: Personas ---------- */

function PersonasOutput({
  data,
  onEdit,
}: {
  data: any;
  onEdit?: (updated: any) => void;
}) {
  const personas = Array.isArray(data) ? data : data.personas || [data];

  function handlePersonaEdit(index: number, field: string, value: string) {
    if (!onEdit) return;
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    onEdit({ personas: updated });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {personas.map((persona: any, i: number) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <EditableText
                  value={persona.name}
                  onChange={
                    onEdit
                      ? (v) => handlePersonaEdit(i, "name", v)
                      : undefined
                  }
                  className="text-sm font-medium"
                />
                {persona.role && (
                  <EditableText
                    value={persona.role}
                    onChange={
                      onEdit
                        ? (v) => handlePersonaEdit(i, "role", v)
                        : undefined
                    }
                    className="text-xs text-muted-foreground"
                  />
                )}
              </div>
            </div>

            {persona.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {persona.bio}
              </p>
            )}

            {persona.goals?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Goals
                </p>
                <div className="flex flex-wrap gap-1">
                  {persona.goals.slice(0, 3).map((g: string, j: number) => (
                    <Badge
                      key={j}
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {persona.frustrations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  <Frown className="w-3 h-3" />
                  Frustrations
                </p>
                <div className="flex flex-wrap gap-1">
                  {persona.frustrations
                    .slice(0, 3)
                    .map((f: string, j: number) => (
                      <Badge
                        key={j}
                        variant="secondary"
                        className="text-[10px] font-normal bg-rose-400/5 text-rose-400/80"
                      >
                        {f}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {persona.quotes?.length > 0 && (
              <blockquote className="text-xs italic text-muted-foreground border-l-2 border-brand/30 pl-3">
                &ldquo;{persona.quotes[0]}&rdquo;
              </blockquote>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Phase 3: Journey / Blueprint ---------- */

function JourneyOutput({ data }: { data: any }) {
  const stages = data.stages || [];
  const nodes = data.nodes || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage: any, i: number) => {
          const stageNodes = nodes.filter(
            (n: any) => n.stage_index === i
          );
          const painCount = stageNodes.filter(
            (n: any) => n.type === "pain_point"
          ).length;
          const nodeCount = stageNodes.length;

          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3 min-w-[140px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{stage.label}</p>
                  <div className="flex gap-1">
                    {nodeCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-normal shrink-0"
                      >
                        {nodeCount}
                      </Badge>
                    )}
                    {painCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-normal shrink-0 bg-rose-400/10 text-rose-400"
                      >
                        {painCount} pain
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stage.description}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
