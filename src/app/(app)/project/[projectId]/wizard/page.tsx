"use client";

import { useParams, useRouter } from "next/navigation";
import { AIWizard } from "@/components/ai/AIWizard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function WizardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
      <ErrorBoundary
        fallbackTitle="AI Wizard error"
        fallbackDescription="The wizard encountered an error. Your progress may be saved — try refreshing."
      >
        <AIWizard
          projectId={projectId}
          onComplete={(mapId) =>
            router.push(`/project/${projectId}/map/${mapId}`)
          }
        />
      </ErrorBoundary>
    </div>
  );
}
