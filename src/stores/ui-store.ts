import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelContent: "node-detail" | "comments" | "version-history" | null;
  activeTool: "select" | "add-touchpoint" | "add-pain-point" | "add-opportunity" | "add-evidence" | "add-action" | "add-emotion" | "add-note" | "connect";
  canvasMode: "blueprint" | "freeform";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setRightPanel: (content: UIState["rightPanelContent"]) => void;
  closeRightPanel: () => void;
  setActiveTool: (tool: UIState["activeTool"]) => void;
  setCanvasMode: (mode: UIState["canvasMode"]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: false,
  rightPanelContent: null,
  activeTool: "select",
  canvasMode: "blueprint",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setRightPanel: (content) =>
    set({ rightPanelOpen: content !== null, rightPanelContent: content }),
  closeRightPanel: () =>
    set({ rightPanelOpen: false, rightPanelContent: null }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCanvasMode: (mode) => set({ canvasMode: mode }),
}));
