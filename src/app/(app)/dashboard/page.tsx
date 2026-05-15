"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Map,
  MoreHorizontal,
  Archive,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { useProjects } from "@/hooks/use-projects";
import { useProjectStore } from "@/stores/project-store";

export default function DashboardPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { projects, createProject, deleteProject, archiveProject } =
    useProjects(currentWorkspace?.id);
  const loading = useProjectStore((s) => s.loading);

  return (
    <>
      <TopBar
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <CreateProjectDialog onCreateProject={createProject} />
        }
      />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-1">
            <h1 className="font-display text-3xl">Your Projects</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your journey maps and service blueprints
            </p>
          </div>

          {(loading || wsLoading) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-amber" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl">
                  Create your first project
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start with a blank canvas or let AI guide you through mapping
                  your customer&apos;s journey
                </p>
              </div>
              <CreateProjectDialog
                onCreateProject={createProject}
                trigger={
                  <Button className="mt-2 bg-amber text-amber-foreground hover:bg-amber/90 gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group"
                >
                  <Card className="border-border/50 hover:border-amber/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber/5 h-full">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center shrink-0 group-hover:bg-amber/20 transition-colors">
                            <Map className="w-4 h-4 text-amber" />
                          </div>
                          <h3 className="font-medium text-sm leading-tight">
                            {project.name}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                archiveProject(project.id);
                              }}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                deleteProject(project.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60">
                        Updated{" "}
                        {formatDistanceToNow(new Date(project.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* Add project card */}
              <CreateProjectDialog
                onCreateProject={createProject}
                trigger={
                  <button className="border border-dashed border-border/60 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2 hover:border-amber/30 hover:bg-amber/5 transition-all duration-200 min-h-[140px] cursor-pointer">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      New Project
                    </span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
