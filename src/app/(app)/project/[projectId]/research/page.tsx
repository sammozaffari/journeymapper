"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  Sparkles,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ResearchItem {
  id: string;
  title: string;
  item_type: string;
  file_url: string | null;
  ai_status: string;
  created_at: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-amber animate-spin" />,
  completed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  failed: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
};

export default function ResearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadResearch() {
      const { data } = await supabase
        .from("research_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) setItems(data);
      setLoading(false);
    }
    loadResearch();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleUploadComplete(item: ResearchItem) {
    setItems((prev) => [item, ...prev]);
  }

  async function handleAnalyze(itemId: string) {
    // Update status optimistically
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ai_status: "processing" } : i))
    );

    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchItemId: itemId }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, ai_status: "completed" } : i
          )
        );
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, ai_status: "failed" } : i
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, ai_status: "failed" } : i
        )
      );
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl">Research</h1>
          <p className="text-sm text-muted-foreground">
            Upload, analyze, and synthesize your research data
          </p>
        </div>
        <Link href={`/project/${projectId}/research/ai-guide`}>
          <Button
            variant="outline"
            className="gap-2 border-violet-400/30 text-violet-400 hover:bg-violet-400/10"
          >
            <Sparkles className="w-4 h-4" />
            AI Guide
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="library">
            Library ({items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <ResearchUploader
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {items.length === 0 ? (
            <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center">
                <FlaskConical className="w-7 h-7 text-amber" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl">No research yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload transcripts, surveys, or notes to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Card key={item.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sky-400/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {item.item_type}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {statusIcons[item.ai_status]}
                          {item.ai_status}
                        </span>
                      </div>
                    </div>
                    {item.ai_status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => handleAnalyze(item.id)}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        Analyze
                      </Button>
                    )}
                    {item.ai_status === "completed" && (
                      <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                        Analyzed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
