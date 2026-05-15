"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Link2,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactElement;
}

type ExportFormat = "pptx" | "share-link";

const exportOptions: Array<{
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = [
  {
    id: "pptx",
    label: "PowerPoint",
    description: "Download as .pptx presentation with all project data",
    icon: FileSpreadsheet,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    id: "share-link",
    label: "Shareable Link",
    description: "Generate a read-only link to share with stakeholders",
    icon: Link2,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
];

export function ExportDialog({
  projectId,
  projectName,
  trigger,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleExport() {
    if (!selectedFormat) return;
    setLoading(true);

    try {
      if (selectedFormat === "pptx") {
        const res = await fetch("/api/export/pptx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-export.pptx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setOpen(false);
        }
      } else if (selectedFormat === "share-link") {
        const res = await fetch("/api/export/share-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });

        if (res.ok) {
          const data = await res.json();
          setShareUrl(data.url);
        }
      }
    } catch (err) {
      console.error("Export error:", err);
    }

    setLoading(false);
  }

  function handleCopyLink() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedFormat(null);
          setShareUrl(null);
        }
      }}
    >
      <DialogTrigger
        render={
          trigger || (
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium text-xl">
            Export Project
          </DialogTitle>
        </DialogHeader>

        {shareUrl ? (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-lg bg-card border border-border/30 space-y-3">
              <p className="text-sm font-medium">Your shareable link is ready</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono truncate"
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  Copy
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Anyone with this link can view your project in read-only mode
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShareUrl(null);
                setSelectedFormat(null);
              }}
            >
              Create Another Export
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedFormat(option.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-150 text-left",
                    selectedFormat === option.id
                      ? "border-brand bg-brand/5"
                      : "border-border/30 hover:border-border/60"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      option.bg
                    )}
                  >
                    <option.icon className={cn("w-5 h-5", option.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={handleExport}
              disabled={!selectedFormat || loading}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {selectedFormat === "share-link" ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {selectedFormat === "share-link"
                    ? "Generate Link"
                    : "Download"}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
