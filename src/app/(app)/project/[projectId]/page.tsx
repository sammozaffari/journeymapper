"use client";

import { useProjectStore } from "@/stores/project-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Map,
  FlaskConical,
  UserCircle,
  Users,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    label: "Create Journey Map",
    description: "Start mapping your customer's experience",
    icon: Map,
    href: "/map",
    color: "text-amber",
    bg: "bg-amber/10",
  },
  {
    label: "Add Research",
    description: "Upload transcripts, surveys, or notes",
    icon: FlaskConical,
    href: "/research",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    label: "AI Guide",
    description: "Let AI help you build your journey map",
    icon: Sparkles,
    href: "/research/ai-guide",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    label: "Define Problem",
    description: "Build your problem statement",
    icon: MessageSquareText,
    href: "/problem",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    label: "Create Personas",
    description: "Define or generate personas from research",
    icon: UserCircle,
    href: "/personas",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    label: "Map Stakeholders",
    description: "Identify and prioritize stakeholders",
    icon: Users,
    href: "/stakeholders",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

export default function ProjectOverviewPage() {
  const project = useProjectStore((s) => s.currentProject);

  if (!project) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Project header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl">{project.name}</h1>
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
              className="group"
            >
              <Card className="border-border/50 hover:border-amber/20 transition-all duration-200 hover:shadow-md hover:shadow-amber/5 h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-medium">{action.label}</h3>
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
