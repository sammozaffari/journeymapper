"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  FlaskConical,
  Sparkles,
  Search,
  X,
  Link2,
  Upload,
  BarChart3,
  Filter,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResearchItem {
  id: string;
  title: string;
  item_type: string;
  file_url: string | null;
  ai_status: string;
  created_at: string;
}

interface Finding {
  id: string;
  project_id: string;
  research_item_id: string | null;
  finding_type: FindingType;
  content: string;
  sentiment: number | null;
  theme: string | null;
  tags: string[];
  source_location: string | null;
  severity: Severity | null;
  stakeholder: string | null;
  created_at: string;
  node_link_count: number;
}

type FindingType =
  | "pain_point"
  | "opportunity"
  | "insight"
  | "need"
  | "behavior"
  | "quote"
  | "decision"
  | "process_gap"
  | "action";

type Severity = "low" | "medium" | "high" | "critical";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FINDING_TYPE_CONFIG: Record<
  FindingType,
  { label: string; color: string; bg: string; border: string }
> = {
  pain_point: {
    label: "Pain Point",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
  opportunity: {
    label: "Opportunity",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  insight: {
    label: "Insight",
    color: "text-brand",
    bg: "bg-brand/10",
    border: "border-brand/20",
  },
  need: {
    label: "Need",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  behavior: {
    label: "Behavior",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  quote: {
    label: "Quote",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  decision: {
    label: "Decision",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  process_gap: {
    label: "Process Gap",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  action: {
    label: "Action",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
};

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  high: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

const ALL_TYPES: FindingType[] = [
  "pain_point",
  "opportunity",
  "insight",
  "need",
  "behavior",
  "quote",
  "decision",
  "process_gap",
  "action",
];

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />,
  completed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  failed: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const supabase = createClient();

  // Upload tab state
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Findings tab state
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsLoading, setFindingsLoading] = useState(true);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<Set<FindingType>>(
    new Set()
  );
  const [selectedSeverity, setSelectedSeverity] = useState<
    Severity | "all"
  >("all");
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(
    new Set()
  );
  const [keyword, setKeyword] = useState("");

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadResearch() {
      const { data } = await supabase
        .from("research_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) setItems(data);
      setItemsLoading(false);
    }
    loadResearch();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadFindings() {
      // Fetch findings
      const { data: findingsData } = await supabase
        .from("findings")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (!findingsData) {
        setFindingsLoading(false);
        return;
      }

      // Fetch node link counts
      const findingIds = findingsData.map((f) => f.id);
      let linkCounts: Record<string, number> = {};

      if (findingIds.length > 0) {
        const { data: links } = await supabase
          .from("finding_node_links")
          .select("finding_id")
          .in("finding_id", findingIds);

        if (links) {
          linkCounts = links.reduce(
            (acc: Record<string, number>, link) => {
              acc[link.finding_id] = (acc[link.finding_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
        }
      }

      const enriched: Finding[] = findingsData.map((f) => ({
        ...f,
        node_link_count: linkCounts[f.id] || 0,
      }));

      setFindings(enriched);
      setFindingsLoading(false);
    }
    loadFindings();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Upload handlers (preserved from original)
  // -------------------------------------------------------------------------

  function handleUploadComplete(item: ResearchItem) {
    setItems((prev) => [item, ...prev]);
  }

  async function handleAnalyze(itemId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, ai_status: "processing" } : i
      )
    );
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchItemId: itemId }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, ai_status: res.ok ? "completed" : "failed" }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, ai_status: "failed" } : i
        )
      );
    }
  }

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const allThemes = useMemo(() => {
    const themes = new Set<string>();
    findings.forEach((f) => {
      if (f.theme) themes.add(f.theme);
    });
    return Array.from(themes).sort();
  }, [findings]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      counts[f.finding_type] = (counts[f.finding_type] || 0) + 1;
    });
    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Type filter (AND: must match one of selected types)
      if (selectedTypes.size > 0 && !selectedTypes.has(f.finding_type)) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== "all") {
        if (f.severity !== selectedSeverity) return false;
      }
      // Theme filter (AND: must match one of selected themes)
      if (selectedThemes.size > 0) {
        if (!f.theme || !selectedThemes.has(f.theme)) return false;
      }
      // Keyword filter
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        if (!f.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [findings, selectedTypes, selectedSeverity, selectedThemes, keyword]);

  const hasActiveFilters =
    selectedTypes.size > 0 ||
    selectedSeverity !== "all" ||
    selectedThemes.size > 0 ||
    keyword.trim().length > 0;

  // -------------------------------------------------------------------------
  // Filter handlers
  // -------------------------------------------------------------------------

  const toggleType = useCallback((type: FindingType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleTheme = useCallback((theme: string) => {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTypes(new Set());
    setSelectedSeverity("all");
    setSelectedThemes(new Set());
    setKeyword("");
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Research</h1>
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

      {/* Tabs */}
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="findings" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Findings ({findings.length})
          </TabsTrigger>
        </TabsList>

        {/* ---- Upload Tab ---- */}
        <TabsContent value="upload" className="mt-6 max-w-3xl">
          <ResearchUploader
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />

          {/* Library list (kept from original) */}
          {items.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Uploaded Items
              </p>
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

        {/* ---- Findings Tab ---- */}
        <TabsContent value="findings" className="mt-6">
          {findingsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading findings...
              </span>
            </div>
          ) : findings.length === 0 ? (
            <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                <FlaskConical className="w-7 h-7 text-brand" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-xl">No findings yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload and analyze research items to extract findings
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* ---------- Left Sidebar: Filter Panel ---------- */}
              <div className="w-[280px] shrink-0">
                <div className="sticky top-6 space-y-6">
                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-6">
                      {/* Filter header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Filters
                          </span>
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="text-[11px] text-brand hover:text-brand/80 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Keyword search */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Search
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter by keyword..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="pl-8 h-8 text-sm"
                          />
                          {keyword && (
                            <button
                              onClick={() => setKeyword("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Type filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Type
                        </label>
                        <div className="space-y-1">
                          {ALL_TYPES.map((type) => {
                            const cfg = FINDING_TYPE_CONFIG[type];
                            const count = typeCounts[type] || 0;
                            const active = selectedTypes.has(type);
                            return (
                              <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                                  active
                                    ? `${cfg.bg} ${cfg.color}`
                                    : "text-foreground/70 hover:bg-accent"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${cfg.bg} ${
                                      active
                                        ? "ring-2 ring-current ring-offset-1 ring-offset-background"
                                        : ""
                                    }`}
                                    style={{
                                      backgroundColor: active
                                        ? undefined
                                        : undefined,
                                    }}
                                  />
                                  <span className="text-xs font-medium">
                                    {cfg.label}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] tabular-nums ${
                                    active
                                      ? cfg.color
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Severity filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Severity
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {(
                            ["all", "low", "medium", "high", "critical"] as const
                          ).map((sev) => {
                            const active = selectedSeverity === sev;
                            const sevCfg =
                              sev !== "all"
                                ? SEVERITY_CONFIG[sev]
                                : null;
                            return (
                              <button
                                key={sev}
                                onClick={() => setSelectedSeverity(sev)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  active
                                    ? sev === "all"
                                      ? "bg-brand/10 text-brand"
                                      : `${sevCfg!.bg} ${sevCfg!.color}`
                                    : "text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {sev === "all"
                                  ? "All"
                                  : SEVERITY_CONFIG[sev].label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Theme filter */}
                      {allThemes.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Themes
                          </label>
                          <ScrollArea className="max-h-[180px] overflow-y-auto">
                            <div className="flex flex-wrap gap-1.5">
                              {allThemes.map((theme) => {
                                const active = selectedThemes.has(theme);
                                return (
                                  <button
                                    key={theme}
                                    onClick={() => toggleTheme(theme)}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
                                      active
                                        ? "bg-brand/10 text-brand border-brand/30"
                                        : "text-muted-foreground border-border/50 hover:border-brand/30 hover:text-foreground"
                                    }`}
                                  >
                                    {theme}
                                  </button>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ---------- Right: Stats + Findings Grid ---------- */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Stats bar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {filteredFindings.length}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {filteredFindings.length === findings.length
                        ? "findings"
                        : `of ${findings.length} findings`}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-border/60" />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ALL_TYPES.map((type) => {
                      const count = typeCounts[type] || 0;
                      if (count === 0) return null;
                      const cfg = FINDING_TYPE_CONFIG[type];
                      return (
                        <span
                          key={type}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}
                        >
                          {cfg.label}
                          <span className="tabular-nums">{count}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Findings grid */}
                {filteredFindings.length === 0 ? (
                  <div className="border border-dashed border-border/60 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3">
                    <Search className="w-8 h-8 text-muted-foreground/40" />
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">
                        No findings match
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Try adjusting your filters or clearing them to see all
                        findings.
                      </p>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1.5 mt-2"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredFindings.map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FindingCard
// ---------------------------------------------------------------------------

function FindingCard({ finding }: { finding: Finding }) {
  const typeCfg = FINDING_TYPE_CONFIG[finding.finding_type];
  const severityCfg = finding.severity
    ? SEVERITY_CONFIG[finding.severity]
    : null;

  return (
    <Card className="border-border/50 hover:border-border/80 transition-colors group">
      <CardContent className="p-4 space-y-3">
        {/* Top row: type badge */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border} border`}
          >
            {typeCfg.label}
          </span>
          {finding.node_link_count > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground bg-accent/60 border border-border/40">
              <Link2 className="w-3 h-3" />
              {finding.node_link_count}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-foreground/90 line-clamp-4">
          {finding.content}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {severityCfg && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${severityCfg.bg} ${severityCfg.color} ${severityCfg.border} border`}
            >
              {severityCfg.label}
            </span>
          )}
          {finding.theme && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground bg-accent/60 border border-border/40">
              {finding.theme}
            </span>
          )}
          {finding.stakeholder && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground bg-accent/60 border border-border/40">
              {finding.stakeholder}
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {new Date(finding.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
