"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  FileOutput,
  FileSpreadsheet,
  Link2,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportDialog } from "@/components/exports/ExportDialog";
import { useProjectStore } from "@/stores/project-store";
import { createClient } from "@/lib/supabase/client";

interface Export {
  id: string;
  export_type: string;
  status: string;
  file_url: string | null;
  share_token: string | null;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  pptx: <FileSpreadsheet className="w-5 h-5 text-orange-400" />,
  interactive_link: <Link2 className="w-5 h-5 text-sky-400" />,
};

const typeLabels: Record<string, string> = {
  pptx: "PowerPoint",
  interactive_link: "Shareable Link",
};

export default function ExportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProjectStore((s) => s.currentProject);
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadExports() {
      const { data } = await supabase
        .from("exports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) setExports(data);
      setLoading(false);
    }
    loadExports();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl">Exports</h1>
          <p className="text-sm text-muted-foreground">
            Generate presentations, reports, and shareable links
          </p>
        </div>
        <ExportDialog
          projectId={projectId}
          projectName={project?.name || "Project"}
        />
      </div>

      {exports.length === 0 && !loading ? (
        <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center">
            <FileOutput className="w-7 h-7 text-amber" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl">No exports yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Generate your first export to share your findings with
              stakeholders
            </p>
          </div>
          <ExportDialog
            projectId={projectId}
            projectName={project?.name || "Project"}
            trigger={
              <Button className="mt-2 bg-amber text-amber-foreground hover:bg-amber/90 gap-2">
                <Download className="w-4 h-4" />
                Create Export
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {exports.map((exp) => (
            <Card key={exp.id} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border/30">
                  {typeIcons[exp.export_type] || (
                    <FileOutput className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium">
                    {typeLabels[exp.export_type] || exp.export_type}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase tracking-wider ${
                        exp.status === "completed"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : exp.status === "generating"
                          ? "bg-amber/10 text-amber"
                          : "bg-muted"
                      }`}
                    >
                      {exp.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(exp.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                {exp.export_type === "interactive_link" && exp.share_token && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const url = `${window.location.origin}/share/${exp.share_token}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Copy Link
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
