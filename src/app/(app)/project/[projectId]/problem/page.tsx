"use client";

import { MessageSquareText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProblemStatementPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl">Problem Statement</h1>
        <p className="text-sm text-muted-foreground">Define and refine your problem statement with AI assistance</p>
      </div>

      <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center">
          <MessageSquareText className="w-7 h-7 text-amber" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-xl">No items yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Define and refine your problem statement with AI assistance
          </p>
        </div>
        <Button className="mt-2 bg-amber text-amber-foreground hover:bg-amber/90 gap-2">
          <Plus className="w-4 h-4" />
          Start Problem Statement
        </Button>
      </div>
    </div>
  );
}
