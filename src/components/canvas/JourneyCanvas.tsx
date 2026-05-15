"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes";
import { CanvasToolbar } from "./CanvasToolbar";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUIStore } from "@/stores/ui-store";
import {
  STAGE_WIDTH,
  LANE_HEIGHT,
  STAGE_HEADER_HEIGHT,
  LANE_LABEL_WIDTH,
  STAGE_GAP,
  LANE_GAP,
} from "@/lib/canvas/defaults";

interface Stage {
  id: string;
  label: string;
  sort_order: number;
  color: string;
}

interface Lane {
  id: string;
  lane_type: string;
  label: string;
  sort_order: number;
  color: string;
}

interface JourneyCanvasProps {
  stages: Stage[];
  lanes: Lane[];
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

function JourneyCanvasInner({
  stages,
  lanes,
  initialNodes,
  initialEdges,
  onSave,
  readOnly = false,
}: JourneyCanvasProps) {
  const [nodes, setNodes, onNodesChangeHandler] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeHandler] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const canvasMode = useUIStore((s) => s.canvasMode);

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    if (!onSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(nodes, edges);
    }, 2000);
  }, [onSave, nodes, edges]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true }, eds));
      triggerSave();
    },
    [setEdges, triggerSave]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Click on canvas to create node (when a tool is active)
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const toolToNodeType: Record<string, string> = {
        "add-touchpoint": "touchpoint",
        "add-pain-point": "pain_point",
        "add-opportunity": "opportunity",
        "add-evidence": "evidence_item",
        "add-action": "action",
        "add-emotion": "emotion",
        "add-note": "note",
      };

      const nodeType = toolToNodeType[activeTool];
      if (nodeType && !readOnly) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: `${nodeType}-${Date.now()}`,
          type: nodeType,
          position,
          data: {
            label: getDefaultLabel(nodeType),
            description: "",
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setSelectedNodeId(newNode.id);
        setActiveTool("select");
        triggerSave();
        return;
      }

      setSelectedNodeId(null);
    },
    [activeTool, readOnly, screenToFlowPosition, setNodes, setSelectedNodeId, setActiveTool, triggerSave]
  );

  // Handle drop from toolbar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (readOnly) return;

      const type = event.dataTransfer.getData("application/reactflow-type");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: getDefaultLabel(type),
          description: "",
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      triggerSave();
    },
    [readOnly, setNodes, screenToFlowPosition, setSelectedNodeId, triggerSave]
  );

  // Trigger save on node move
  const handleNodesChange: typeof onNodesChangeHandler = useCallback(
    (changes) => {
      onNodesChangeHandler(changes);
      const hasPositionChange = changes.some(
        (c) => c.type === "position" && c.dragging === false
      );
      if (hasPositionChange) triggerSave();
    },
    [onNodesChangeHandler, triggerSave]
  );

  // Calculate total canvas dimensions
  const totalWidth = LANE_LABEL_WIDTH + stages.length * (STAGE_WIDTH + STAGE_GAP);
  const totalHeight = STAGE_HEADER_HEIGHT + lanes.length * (LANE_HEIGHT + LANE_GAP);

  return (
    <div className="flex-1 flex relative">
      {!readOnly && <CanvasToolbar />}

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid={canvasMode === "blueprint"}
          snapGrid={[20, 20]}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={readOnly ? null : "Backspace"}
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(100, 100, 120, 0.15)"
          />
          <MiniMap
            className="!bg-card !border-border/50 !rounded-lg"
            maskColor="rgba(8, 9, 10, 0.7)"
            nodeColor="rgba(94, 106, 210, 0.6)"
          />
          <Controls
            className="!bg-card !border-border/50 !rounded-lg !shadow-none [&>button]:!bg-card [&>button]:!border-border/30 [&>button]:!text-foreground [&>button:hover]:!bg-accent"
          />

          {/* Swim lane backgrounds */}
          {canvasMode === "blueprint" && (
            <Panel position="top-left" className="!m-0 !p-0 pointer-events-none">
              <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
                {/* Stage headers */}
                <div
                  className="absolute flex"
                  style={{ left: LANE_LABEL_WIDTH, top: 0 }}
                >
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-center text-xs font-medium text-muted-foreground/80 border-b border-border/30"
                      style={{
                        width: STAGE_WIDTH,
                        height: STAGE_HEADER_HEIGHT,
                        marginRight: STAGE_GAP,
                      }}
                    >
                      {stage.label}
                    </div>
                  ))}
                </div>

                {/* Lane labels and backgrounds */}
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="absolute flex"
                    style={{
                      top: STAGE_HEADER_HEIGHT + lane.sort_order * (LANE_HEIGHT + LANE_GAP),
                      left: 0,
                      width: totalWidth,
                      height: LANE_HEIGHT,
                    }}
                  >
                    <div
                      className="flex items-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40 px-3"
                      style={{ width: LANE_LABEL_WIDTH, writingMode: "horizontal-tb" }}
                    >
                      {lane.label}
                    </div>
                    <div
                      className="flex-1 rounded-md border border-border/10"
                      style={{ background: lane.color }}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Node detail panel */}
      {selectedNodeId && !readOnly && (
        <NodeDetailPanel
          nodeId={selectedNodeId}
          nodes={nodes}
          onUpdate={(id, data) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, ...data } } : n
              )
            );
            triggerSave();
          }}
          onClose={() => setSelectedNodeId(null)}
          onDelete={(id) => {
            setNodes((nds) => nds.filter((n) => n.id !== id));
            setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
            setSelectedNodeId(null);
            triggerSave();
          }}
        />
      )}
    </div>
  );
}

// Wrap with ReactFlowProvider so useReactFlow() works
export function JourneyCanvas(props: JourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <JourneyCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function getDefaultLabel(type: string): string {
  const labels: Record<string, string> = {
    touchpoint: "New Touchpoint",
    pain_point: "Pain Point",
    opportunity: "Opportunity",
    moment_of_truth: "Moment of Truth",
    evidence_item: "Evidence",
    action: "Action",
    emotion: "Emotion",
    note: "Note",
  };
  return labels[type] || "New Node";
}
