import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Find the export by share token
  const { data: exportRecord } = await supabase
    .from("exports")
    .select("*, projects(*)")
    .eq("share_token", token)
    .eq("status", "completed")
    .single();

  if (!exportRecord) {
    notFound();
  }

  const project = exportRecord.projects as any;
  const projectId = project?.id;

  if (!projectId) {
    notFound();
  }

  // Fetch project data for display
  const [mapsResult, personasResult, findingsResult, problemResult] =
    await Promise.all([
      supabase
        .from("journey_maps")
        .select("*, stages(*), map_nodes(*)")
        .eq("project_id", projectId),
      supabase.from("personas").select("*").eq("project_id", projectId),
      supabase.from("findings").select("*").eq("project_id", projectId).limit(20),
      supabase
        .from("problem_statements")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const maps = mapsResult.data || [];
  const personas = personasResult.data || [];
  const findings = findingsResult.data || [];
  const problem = problemResult.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-foreground"
              >
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">
              Shared via JourneyMapper
            </span>
          </div>
          <h1 className="font-display text-4xl">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Problem Statement */}
        {problem && (
          <section className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Problem Statement
            </h2>
            <blockquote className="text-lg font-display leading-relaxed border-l-2 border-amber/40 pl-6">
              {problem.statement}
            </blockquote>
            {problem.context && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {problem.context}
              </p>
            )}
          </section>
        )}

        {/* Journey Maps */}
        {maps.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Journey Maps
            </h2>
            {maps.map((map: any) => (
              <div key={map.id} className="space-y-4">
                <h3 className="font-display text-2xl">{map.name}</h3>
                {map.stages && map.stages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(map.stages as any[])
                      .sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((stage: any) => {
                        const stageNodes = (map.map_nodes as any[])?.filter(
                          (n: any) => n.stage_id === stage.id
                        ) || [];
                        return (
                          <div
                            key={stage.id}
                            className="flex-1 min-w-[200px] p-4 rounded-lg border border-border/30 bg-card/50 space-y-3"
                          >
                            <h4 className="text-sm font-medium text-amber">
                              {stage.label}
                            </h4>
                            {stageNodes.length > 0 && (
                              <div className="space-y-1.5">
                                {stageNodes.map((node: any) => (
                                  <div
                                    key={node.id}
                                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                                  >
                                    <span className="text-amber/60 mt-0.5">
                                      {node.node_type === "pain_point"
                                        ? "!"
                                        : node.node_type === "opportunity"
                                        ? "+"
                                        : "·"}
                                    </span>
                                    {node.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Personas */}
        {personas.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Personas
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {personas.map((persona: any) => (
                <div
                  key={persona.id}
                  className="p-5 rounded-lg border border-border/30 bg-card/50 space-y-3"
                >
                  <div>
                    <h3 className="font-display text-lg">{persona.name}</h3>
                    {persona.role && (
                      <p className="text-xs text-muted-foreground">
                        {persona.role}
                      </p>
                    )}
                  </div>
                  {persona.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {persona.bio}
                    </p>
                  )}
                  {persona.quotes?.length > 0 && (
                    <blockquote className="text-xs italic text-muted-foreground border-l-2 border-amber/30 pl-3">
                      &ldquo;{persona.quotes[0]}&rdquo;
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Findings */}
        {findings.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Key Findings
            </h2>
            <div className="space-y-2">
              {findings.map((finding: any) => (
                <div
                  key={finding.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/20"
                >
                  <span className="text-amber mt-0.5 text-xs font-medium uppercase tracking-wider">
                    {finding.finding_type}
                  </span>
                  <p className="text-sm text-muted-foreground flex-1">
                    {finding.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 text-center">
        <p className="text-xs text-muted-foreground/50">
          Created with JourneyMapper — AI-Powered Service Blueprinting
        </p>
      </footer>
    </div>
  );
}
