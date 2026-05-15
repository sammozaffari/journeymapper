"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageSquareText, Sparkles, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface ProblemStatement {
  id: string;
  statement: string;
  context: string | null;
  impact: string | null;
  current_state: string | null;
  desired_state: string | null;
  constraints: string[];
  assumptions: string[];
  is_ai_refined: boolean;
}

export default function ProblemPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProblem() {
      const { data } = await supabase
        .from("problem_statements")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setProblem(data);
        setDraft(data.statement);
      }
      setLoading(false);
    }
    loadProblem();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRefine() {
    if (!draft.trim()) return;
    setRefining(true);

    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          statement: draft.trim(),
        }),
      });

      if (res.ok) {
        const refined = await res.json();
        setProblem(refined);
        setDraft(refined.statement);
      }
    } catch (err) {
      console.error("Refinement error:", err);
    }

    setRefining(false);
  }

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);

    if (problem) {
      await supabase
        .from("problem_statements")
        .update({ statement: draft.trim() })
        .eq("id", problem.id);
    } else {
      const { data } = await supabase
        .from("problem_statements")
        .insert({
          project_id: projectId,
          statement: draft.trim(),
        })
        .select()
        .single();

      if (data) setProblem(data);
    }

    setSaving(false);
  }

  if (loading) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="font-semibold text-3xl tracking-tight">Problem Statement</h1>
        <p className="text-sm text-muted-foreground">
          Define and refine your problem statement with AI assistance
        </p>
      </div>

      {/* Input area */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Describe the problem you&apos;re trying to solve
          </Label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g., Our customers struggle to complete the onboarding process, with 40% dropping off before completing their first task..."
            rows={4}
            className="resize-none text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRefine}
            disabled={refining || !draft.trim()}
            className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            {refining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Refine with AI
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Refined output */}
      {problem && problem.is_ai_refined && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              AI-Refined Analysis
            </h2>
            <Badge className="bg-violet-400/10 text-violet-400 border-violet-400/20 text-[9px]">
              AI
            </Badge>
          </div>

          <div className="grid gap-4">
            {problem.context && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.context}
                  </p>
                </CardContent>
              </Card>
            )}

            {problem.impact && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.impact}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {problem.current_state && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-rose-400">
                      Current State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {problem.current_state}
                    </p>
                  </CardContent>
                </Card>
              )}

              {problem.desired_state && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-400">
                      Desired State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {problem.desired_state}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {problem.constraints.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Constraints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-brand mt-1.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {problem.assumptions.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Assumptions to Validate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {problem.assumptions.map((a, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-brand mt-1.5">?</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
