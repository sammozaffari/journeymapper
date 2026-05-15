"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { UserCircle, Plus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "@/components/personas/PersonaCard";
import { createClient } from "@/lib/supabase/client";

interface Persona {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  quotes: string[];
  is_ai_generated: boolean;
}

export default function PersonasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadPersonas() {
      const { data } = await supabase
        .from("personas")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) setPersonas(data);
      setLoading(false);
    }
    loadPersonas();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGeneratePersona() {
    setGenerating(true);

    try {
      // Fetch research findings for context
      const { data: findings } = await supabase
        .from("findings")
        .select("*")
        .eq("project_id", projectId);

      const context = findings?.length
        ? `Research findings:\n${findings.map((f) => `- [${f.finding_type}] ${f.content}`).join("\n")}`
        : "No research data available yet. Generate a representative persona for this project.";

      const res = await fetch("/api/ai/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, context }),
      });

      if (res.ok) {
        const persona = await res.json();
        setPersonas((prev) => [persona, ...prev]);
      }
    } catch (err) {
      console.error("Persona generation error:", err);
    }

    setGenerating(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Personas</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage personas from your research findings
          </p>
        </div>
        <Button
          onClick={handleGeneratePersona}
          disabled={generating}
          className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Persona
            </>
          )}
        </Button>
      </div>

      {personas.length === 0 && !loading ? (
        <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-400/10 flex items-center justify-center">
            <UserCircle className="w-7 h-7 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-xl">No personas yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Generate personas from your research data or create them manually
            </p>
          </div>
          <Button
            onClick={handleGeneratePersona}
            disabled={generating}
            className="mt-2 bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate from Research
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      )}
    </div>
  );
}
