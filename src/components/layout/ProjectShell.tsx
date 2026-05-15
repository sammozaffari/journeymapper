"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  UserCircle,
  Users,
  MessageSquareText,
  FileOutput,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  workspace_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProjectShellProps {
  project: Project;
  children: React.ReactNode;
}

const tabs = [
  { label: "Overview", icon: LayoutDashboard, segment: "" },
  { label: "Maps", icon: Map, segment: "/map" },
  { label: "Research", icon: FlaskConical, segment: "/research" },
  { label: "Personas", icon: UserCircle, segment: "/personas" },
  { label: "Stakeholders", icon: Users, segment: "/stakeholders" },
  { label: "Problem", icon: MessageSquareText, segment: "/problem" },
  { label: "Exports", icon: FileOutput, segment: "/exports" },
];

export function ProjectShell({ project, children }: ProjectShellProps) {
  const pathname = usePathname();
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

  useEffect(() => {
    setCurrentProject(project as any);
    return () => setCurrentProject(null);
  }, [project, setCurrentProject]);

  const basePath = `/project/${project.id}`;

  // Determine which tab is active
  function isTabActive(segment: string) {
    if (segment === "") {
      return pathname === basePath;
    }
    return pathname.startsWith(`${basePath}${segment}`);
  }

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name },
        ]}
      />

      {/* Tab navigation */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const active = isTabActive(tab.segment);
              return (
                <Link
                  key={tab.segment}
                  href={`${basePath}${tab.segment}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-amber text-amber"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1">{children}</main>
    </>
  );
}
