import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
}

interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  projects: [],
  currentProject: null,
  loading: false,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ loading }),
  addProject: (project) =>
    set((s) => ({ projects: [project, ...s.projects] })),
  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        s.currentProject?.id === id
          ? { ...s.currentProject, ...updates }
          : s.currentProject,
    })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    })),
}));
