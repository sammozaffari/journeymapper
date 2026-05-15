"use client";

import { useParams, useRouter } from "next/navigation";
import { AIWizard } from "@/components/ai/AIWizard";

export default function WizardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
      <AIWizard
        projectId={projectId}
        onComplete={(mapId) =>
          router.push(`/project/${projectId}/map/${mapId}`)
        }
      />
    </div>
  );
}
