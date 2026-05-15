"use client";

import {
  AlertTriangle,
  Target,
  Frown,
  Lightbulb,
  UserCircle,
  Quote,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PhaseOutputProps {
  phase: number;
  output: any;
  onEdit?: (field: string, value: any) => void;
}

export function PhaseOutput({ phase, output }: PhaseOutputProps) {
  switch (phase) {
    case 0:
      return <ProblemOutput data={output} />;
    case 1:
      return <ContextOutput data={output} />;
    case 2:
      return <PersonasOutput data={output} />;
    case 3:
      return <JourneyOutput data={output} />;
    default:
      return null;
  }
}

/* ---------- Phase 0: Problem ---------- */

function ProblemOutput({ data }: { data: any }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Problem Statement
          </p>
          <p className="text-sm leading-relaxed font-medium">{data.statement}</p>
        </div>

        {data.context && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Context
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.context}
            </p>
          </div>
        )}

        {data.impact && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Impact
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.impact}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.current_state && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-rose-400/80 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3" />
                Current State
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.current_state}
              </p>
            </div>
          )}
          {data.desired_state && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/80 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Desired State
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.desired_state}
              </p>
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
                  className="text-[10px] font-normal bg-amber-400/10 text-amber-600"
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

function PersonasOutput({ data }: { data: any }) {
  const personas = Array.isArray(data) ? data : data.personas || [data];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {personas.map((persona: any, i: number) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium">{persona.name}</h4>
                {persona.role && (
                  <p className="text-xs text-muted-foreground">{persona.role}</p>
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

/* ---------- Phase 3: Journey ---------- */

function JourneyOutput({ data }: { data: any }) {
  const stages = data.stages || [];
  const nodes = data.nodes || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage: any, i: number) => {
          const nodeCount = nodes.filter(
            (n: any) => n.stage_index === i
          ).length;

          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3 min-w-[140px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{stage.label}</p>
                  {nodeCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-normal shrink-0"
                    >
                      {nodeCount} items
                    </Badge>
                  )}
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
