"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useWorkspace } from "@/hooks/use-workspace";

interface AppShellProps {
  user: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const { currentWorkspace } = useWorkspace();
  const pathname = usePathname();

  // Extract project ID from path if inside a project
  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  const currentProjectId = projectMatch?.[1];

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        workspace={currentWorkspace}
        currentProjectId={currentProjectId}
      />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
