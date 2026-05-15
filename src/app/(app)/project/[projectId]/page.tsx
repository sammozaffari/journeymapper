"use client";

import { useProjectStore } from "@/stores/project-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, FlaskConical, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    label: "Start with AI Guide",
    description:
      "Build a complete journey map through a guided 5-step wizard — problem, research, personas, and journey",
    icon: Sparkles,
    href: "/wizard",
    color: "text-brand",
    bg: "bg-brand/10",
    featured: true,
  },
  {
    label: "Create Journey Map",
    description: "Start with a blank canvas and build your map manually",
    icon: Map,
    href: "/map",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    label: "Upload Research",
    description: "Upload transcripts, surveys, or notes to inform your map",
    icon: FlaskConical,
    href: "/research",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
];

export default function ProjectOverviewPage() {
  const project = useProjectStore((s) => s.currentProject);

  if (!project) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Project header */}
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground text-sm max-w-2xl">
            {project.description}
          </p>
        )}
      </div>

      {/* Quick actions grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={`/project/${project.id}${action.href}`}
              className={cn("group", action.featured && "sm:col-span-2 lg:col-span-3")}
            >
              <Card
                className={cn(
                  "border-border/50 hover:border-brand/20 transition-all duration-200 hover:shadow-md hover:shadow-brand/5 h-full",
                  action.featured && "border-brand/20 bg-brand/[0.03]"
                )}
              >
                <CardContent
                  className={cn(
                    "p-4 flex items-start gap-3",
                    action.featured && "p-5"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                      action.featured ? "w-12 h-12" : "w-10 h-10",
                      action.bg
                    )}
                  >
                    <action.icon
                      className={cn(
                        action.featured ? "w-6 h-6" : "w-5 h-5",
                        action.color
                      )}
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3
                      className={cn(
                        "font-medium",
                        action.featured ? "text-base" : "text-sm"
                      )}
                    >
                      {action.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
