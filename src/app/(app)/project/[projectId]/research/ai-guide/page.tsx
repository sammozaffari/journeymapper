"use client";

import { useParams, useRouter } from "next/navigation";
import { GuidedConversation } from "@/components/ai/GuidedConversation";

export default function AIGuidePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  function handleMapGenerated(mapData: any) {
    if (mapData?.id) {
      router.push(`/project/${projectId}/map/${mapData.id}`);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
      <GuidedConversation
        projectId={projectId}
        onMapGenerated={handleMapGenerated}
      />
    </div>
  );
}
