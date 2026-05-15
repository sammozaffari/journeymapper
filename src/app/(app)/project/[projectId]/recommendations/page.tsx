"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Lightbulb,
  LayoutList,
  Grid2x2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

interface Recommendation {
  id: string;
  project_id: string;
  insight_id: string | null;
  node_id: string | null;
  solution_type: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  owner: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const SOLUTION_TYPES = [
  "process_change",
  "ui_improvement",
  "training",
  "policy_update",
  "communication",
  "technology",
] as const;

const STATUSES = [
  "proposed",
  "approved",
  "in_progress",
  "completed",
  "rejected",
] as const;

const impactColors: Record<string, string> = {
  low: "bg-emerald-400/10 text-emerald-500",
  medium: "bg-amber-400/10 text-amber-500",
  high: "bg-rose-400/10 text-rose-500",
};

const effortColors: Record<string, string> = {
  low: "bg-emerald-400/10 text-emerald-500",
  medium: "bg-amber-400/10 text-amber-500",
  high: "bg-rose-400/10 text-rose-500",
};

const statusColors: Record<string, string> = {
  proposed: "bg-muted text-muted-foreground",
  approved: "bg-brand/10 text-brand",
  in_progress: "bg-sky-400/10 text-sky-500",
  completed: "bg-emerald-400/10 text-emerald-500",
  rejected: "bg-rose-400/10 text-rose-500",
};

function formatLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecommendationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<"list" | "matrix">("list");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const supabase = createClient();

  const loadRecommendations = useCallback(async () => {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (data) setRecommendations(data);
    setLoading(false);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        await loadRecommendations();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function updateField(id: string, field: string, value: string) {
    await supabase
      .from("recommendations")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function getQuadrant(r: Recommendation) {
    const highImpact = r.impact === "high" || r.impact === "medium";
    const highEffort = r.effort === "high" || r.effort === "medium";
    if (highImpact && !highEffort) return "quick-wins";
    if (highImpact && highEffort) return "strategic";
    if (!highImpact && !highEffort) return "fill-ins";
    return "avoid";
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">
            Recommendations
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations based on pain points and opportunities
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Recommendations
        </Button>
      </div>

      {recommendations.length === 0 ? (
        /* Empty state */
        <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Lightbulb className="w-7 h-7 text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-xl">No recommendations yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Generate AI-powered recommendations from your pain points and
              opportunities.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-2 bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Recommendations
          </Button>
        </div>
      ) : (
        <>
          {/* View toggle */}
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "list" | "matrix")}
          >
            <TabsList>
              <TabsTrigger value="list" className="gap-1.5">
                <LayoutList className="w-3.5 h-3.5" />
                List
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-1.5">
                <Grid2x2 className="w-3.5 h-3.5" />
                Matrix
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {view === "list" ? (
            /* List view */
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title - inline editable */}
                        {editingTitle === rec.id ? (
                          <Input
                            defaultValue={rec.title}
                            autoFocus
                            className="text-base font-medium h-8"
                            onBlur={(e) => {
                              updateField(rec.id, "title", e.target.value);
                              setEditingTitle(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateField(
                                  rec.id,
                                  "title",
                                  (e.target as HTMLInputElement).value
                                );
                                setEditingTitle(null);
                              }
                              if (e.key === "Escape") setEditingTitle(null);
                            }}
                          />
                        ) : (
                          <h3
                            className="text-base font-medium cursor-pointer hover:text-brand transition-colors"
                            onClick={() => setEditingTitle(rec.id)}
                          >
                            {rec.title}
                          </h3>
                        )}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {rec.description}
                        </p>
                      </div>

                      {/* Status dropdown */}
                      <div className="relative shrink-0">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            updateField(rec.id, "status", e.target.value)
                          }
                          className="appearance-none bg-transparent border border-border/50 rounded-md px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatLabel(s)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider bg-brand/10 text-brand"
                      >
                        {formatLabel(rec.solution_type)}
                      </Badge>

                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Impact
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase tracking-wider ${
                          impactColors[rec.impact] || ""
                        }`}
                      >
                        {rec.impact}
                      </Badge>

                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Effort
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase tracking-wider ${
                          effortColors[rec.effort] || ""
                        }`}
                      >
                        {rec.effort}
                      </Badge>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase tracking-wider ${
                          statusColors[rec.status] || ""
                        }`}
                      >
                        {formatLabel(rec.status)}
                      </Badge>
                    </div>

                    {/* Owner + linked info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium uppercase tracking-wider">
                          Owner
                        </span>
                        {editingOwner === rec.id ? (
                          <Input
                            defaultValue={rec.owner || ""}
                            placeholder="Assign owner..."
                            autoFocus
                            className="h-6 w-40 text-xs"
                            onBlur={(e) => {
                              updateField(rec.id, "owner", e.target.value);
                              setEditingOwner(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateField(
                                  rec.id,
                                  "owner",
                                  (e.target as HTMLInputElement).value
                                );
                                setEditingOwner(null);
                              }
                              if (e.key === "Escape") setEditingOwner(null);
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => setEditingOwner(rec.id)}
                          >
                            {rec.owner || "Unassigned"}
                          </span>
                        )}
                      </div>
                      {rec.insight_id && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          Linked to finding
                        </span>
                      )}
                      {rec.node_id && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          Linked to node
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Matrix view */
            <div className="grid grid-cols-2 grid-rows-2 gap-3 min-h-[500px]">
              {/* Top-left: Quick Wins */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                  Quick Wins
                </h4>
                <p className="text-[10px] text-emerald-600/70 mb-3">
                  High Impact / Low Effort
                </p>
                <div className="space-y-2">
                  {recommendations
                    .filter((r) => getQuadrant(r) === "quick-wins")
                    .map((r) => (
                      <MatrixCard key={r.id} rec={r} />
                    ))}
                </div>
              </div>

              {/* Top-right: Strategic */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wider text-amber-700">
                  Strategic
                </h4>
                <p className="text-[10px] text-amber-600/70 mb-3">
                  High Impact / High Effort
                </p>
                <div className="space-y-2">
                  {recommendations
                    .filter((r) => getQuadrant(r) === "strategic")
                    .map((r) => (
                      <MatrixCard key={r.id} rec={r} />
                    ))}
                </div>
              </div>

              {/* Bottom-left: Fill-ins */}
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fill-ins
                </h4>
                <p className="text-[10px] text-muted-foreground/70 mb-3">
                  Low Impact / Low Effort
                </p>
                <div className="space-y-2">
                  {recommendations
                    .filter((r) => getQuadrant(r) === "fill-ins")
                    .map((r) => (
                      <MatrixCard key={r.id} rec={r} />
                    ))}
                </div>
              </div>

              {/* Bottom-right: Avoid */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wider text-rose-700">
                  Avoid
                </h4>
                <p className="text-[10px] text-rose-600/70 mb-3">
                  Low Impact / High Effort
                </p>
                <div className="space-y-2">
                  {recommendations
                    .filter((r) => getQuadrant(r) === "avoid")
                    .map((r) => (
                      <MatrixCard key={r.id} rec={r} />
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MatrixCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="bg-white rounded-lg border border-border/40 p-3 shadow-sm space-y-1.5">
      <h5 className="text-sm font-medium leading-snug">{rec.title}</h5>
      <div className="flex items-center gap-1.5">
        <Badge
          variant="secondary"
          className="text-[9px] uppercase tracking-wider bg-brand/10 text-brand"
        >
          {formatLabel(rec.solution_type)}
        </Badge>
        <Badge
          variant="secondary"
          className={`text-[9px] uppercase tracking-wider ${
            statusColors[rec.status] || ""
          }`}
        >
          {formatLabel(rec.status)}
        </Badge>
      </div>
    </div>
  );
}
