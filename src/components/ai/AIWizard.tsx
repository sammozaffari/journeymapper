"use client";

import { useState, useCallback } from "react";
import {
  MessageSquareText,
  FlaskConical,
  UserCircle,
  Map,
  CheckCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardPhase } from "./WizardPhase";
import { PhaseOutput } from "./PhaseOutput";
import { cn } from "@/lib/utils";

interface AIWizardProps {
  projectId: string;
  onComplete: (mapId: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PHASES = [
  {
    name: "Problem",
    icon: MessageSquareText,
    description: "Define the problem you're solving",
    prompt: "Tell me about the problem you're trying to solve. What service or experience are you looking at, and what's not working?",
  },
  {
    name: "Context",
    icon: FlaskConical,
    description: "Gather research and context",
    prompt: "What research or data do you have? Share customer feedback, survey results, or known pain points.",
  },
  {
    name: "Personas",
    icon: UserCircle,
    description: "Identify key user types",
    prompt: "Who are the different types of users affected by this problem? Tell me about their goals and behaviors.",
  },
  {
    name: "Journey",
    icon: Map,
    description: "Map the customer journey",
    prompt: "Walk me through the stages a customer goes through. What happens at each step?",
  },
  {
    name: "Review",
    icon: CheckCircle,
    description: "Review and finalize",
    prompt: "",
  },
];

export function AIWizard({ projectId, onComplete }: AIWizardProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseComplete, setPhaseComplete] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [phaseOutputs, setPhaseOutputs] = useState<Record<string, any>>({});
  const [phaseMessages, setPhaseMessages] = useState<Record<number, Message[]>>(
    {}
  );
  const [generatedMapId, setGeneratedMapId] = useState<string | null>(null);

  const phaseKeys = ["problem", "context", "personas", "journey", "review"];

  const handleOutputGenerated = useCallback(
    (phase: number, output: any) => {
      const key = phaseKeys[phase];
      setPhaseOutputs((prev) => ({ ...prev, [key]: output }));
      setPhaseComplete((prev) => {
        const next = [...prev];
        next[phase] = true;
        return next;
      });

      // If journey phase, capture mapId
      if (phase === 3 && output?.journey_map_id) {
        setGeneratedMapId(output.journey_map_id);
      }
    },
    [phaseKeys]
  );

  const handleMessagesUpdate = useCallback(
    (phase: number, messages: Message[]) => {
      setPhaseMessages((prev) => ({ ...prev, [phase]: messages }));
    },
    []
  );

  const buildContext = useCallback(
    (upToPhase: number) => {
      const parts: string[] = [];
      if (phaseOutputs.problem) {
        parts.push(
          `## Problem Statement\n${JSON.stringify(phaseOutputs.problem, null, 2)}`
        );
      }
      if (upToPhase >= 1 && phaseOutputs.context) {
        parts.push(
          `## Research Context\n${JSON.stringify(phaseOutputs.context, null, 2)}`
        );
      }
      if (upToPhase >= 2 && phaseOutputs.personas) {
        parts.push(
          `## Personas\n${JSON.stringify(phaseOutputs.personas, null, 2)}`
        );
      }
      if (upToPhase >= 3 && phaseOutputs.journey) {
        parts.push(
          `## Journey Map\n${JSON.stringify(phaseOutputs.journey, null, 2)}`
        );
      }
      return parts.join("\n\n---\n\n");
    },
    [phaseOutputs]
  );

  const canAdvance = phaseComplete[currentPhase];
  const canGoBack = currentPhase > 0;

  function handleNext() {
    if (currentPhase < 4) {
      setCurrentPhase((p) => p + 1);
    }
  }

  function handleBack() {
    if (currentPhase > 0) {
      setCurrentPhase((p) => p - 1);
    }
  }

  function handleOpenInCanvas() {
    if (generatedMapId) {
      onComplete(generatedMapId);
    }
  }

  // Review phase
  const isReview = currentPhase === 4;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Step indicator */}
      <div className="border-b border-border/50 bg-card/50 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isActive = i === currentPhase;
              const isDone = phaseComplete[i];
              const isFuture = i > currentPhase && !isDone;

              return (
                <div key={phase.name} className="flex items-center gap-0 flex-1 last:flex-none">
                  <button
                    onClick={() => {
                      if (isDone || i <= currentPhase) setCurrentPhase(i);
                    }}
                    disabled={isFuture && !isDone}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive && "bg-brand/10",
                      isDone && !isActive && "hover:bg-muted/50",
                      isFuture && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isActive && "bg-brand text-brand-foreground",
                        isDone && !isActive && "bg-emerald-500/15 text-emerald-500",
                        isFuture && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isDone && !isActive ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive && "text-brand",
                        isDone && !isActive && "text-emerald-500",
                        isFuture && "text-muted-foreground"
                      )}
                    >
                      {phase.name}
                    </span>
                  </button>
                  {i < PHASES.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-px mx-1",
                        i < currentPhase || isDone
                          ? "bg-emerald-500/30"
                          : "bg-border/50"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isReview ? (
          <ReviewPhase
            phaseOutputs={phaseOutputs}
            onOpenInCanvas={handleOpenInCanvas}
            hasMapId={!!generatedMapId}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Show output if phase is complete */}
            {phaseComplete[currentPhase] && phaseOutputs[phaseKeys[currentPhase]] && (
              <div className="border-b border-border/50 bg-card/30 overflow-y-auto max-h-[40%]">
                <div className="max-w-3xl mx-auto p-4">
                  <PhaseOutput
                    phase={currentPhase}
                    output={phaseOutputs[phaseKeys[currentPhase]]}
                    onEdit={(updated) => {
                      const key = phaseKeys[currentPhase];
                      setPhaseOutputs((prev) => ({ ...prev, [key]: updated }));
                    }}
                  />
                </div>
              </div>
            )}

            {/* Chat UI */}
            <WizardPhase
              projectId={projectId}
              phase={currentPhase}
              phaseName={PHASES[currentPhase].name}
              phaseDescription={PHASES[currentPhase].description}
              context={buildContext(currentPhase)}
              previousOutputs={phaseOutputs}
              onOutputGenerated={(output) =>
                handleOutputGenerated(currentPhase, output)
              }
              initialMessages={phaseMessages[currentPhase]}
              onMessagesUpdate={(msgs) =>
                handleMessagesUpdate(currentPhase, msgs)
              }
              emptyStatePrompt={PHASES[currentPhase].prompt}
              phaseIcon={PHASES[currentPhase].icon}
            />
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-border/50 bg-card/50 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBack}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {currentPhase + 1} of {PHASES.length}
          </div>

          {currentPhase < 4 && (
            <Button
              onClick={handleNext}
              disabled={!canAdvance}
              className={cn(
                "gap-2",
                canAdvance
                  ? "bg-brand text-brand-foreground hover:bg-brand/90"
                  : ""
              )}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentPhase === 4 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                onClick={handleOpenInCanvas}
                disabled={!generatedMapId}
                className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Map className="w-4 h-4" />
                Open in Canvas
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Review Phase ---------- */

function ReviewPhase({
  phaseOutputs,
  onOpenInCanvas,
  hasMapId,
}: {
  phaseOutputs: Record<string, any>;
  onOpenInCanvas: () => void;
  hasMapId: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-brand" />
          </div>
          <h2 className="font-semibold text-2xl tracking-tight">
            Your Journey Map is Ready
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Review everything below, then open in the canvas editor to refine
            and share.
          </p>
        </div>

        {phaseOutputs.problem && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Problem Statement
            </h3>
            <PhaseOutput phase={0} output={phaseOutputs.problem} />
          </div>
        )}

        {phaseOutputs.context && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Research Context
            </h3>
            <PhaseOutput phase={1} output={phaseOutputs.context} />
          </div>
        )}

        {phaseOutputs.personas && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Personas
            </h3>
            <PhaseOutput phase={2} output={phaseOutputs.personas} />
          </div>
        )}

        {phaseOutputs.journey && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Journey Map
            </h3>
            <PhaseOutput phase={3} output={phaseOutputs.journey} />
          </div>
        )}
      </div>
    </div>
  );
}
