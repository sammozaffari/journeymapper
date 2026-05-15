"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  Users,
  UserCircle,
  MessageSquareText,
  FileOutput,
  Settings,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface AppSidebarProps {
  user: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
  currentProjectId?: string;
}

const projectNavItems = [
  { label: "Overview", icon: LayoutDashboard, href: "" },
  { label: "Journey Maps", icon: Map, href: "/map" },
  { label: "Research", icon: FlaskConical, href: "/research" },
  { label: "Personas", icon: UserCircle, href: "/personas" },
  { label: "Stakeholders", icon: Users, href: "/stakeholders" },
  { label: "Problem Statement", icon: MessageSquareText, href: "/problem" },
  { label: "Exports", icon: FileOutput, href: "/exports" },
];

export function AppSidebar({
  user,
  workspace,
  currentProjectId,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-foreground"
            >
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            JourneyMapper
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Workspace section */}
        {workspace && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Workspace
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard"}
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>All Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/workspace/settings" />}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Project navigation */}
        {currentProjectId && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Project
            </SidebarGroupLabel>
            <SidebarMenu>
              {projectNavItems.map((item) => {
                const href = `/project/${currentProjectId}${item.href}`;
                const isActive =
                  item.href === ""
                    ? pathname === `/project/${currentProjectId}`
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={href} />}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-brand/15 text-brand text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.full_name || user.email}
              </p>
              {user.full_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem
              onClick={() => router.push("/workspace/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
