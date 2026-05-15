"use client";

import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StakeholdersPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="font-semibold text-3xl tracking-tight">Stakeholders</h1>
        <p className="text-sm text-muted-foreground">Identify and prioritize your project stakeholders</p>
      </div>

      <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Users className="w-7 h-7 text-brand" />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-xl">No items yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Identify and prioritize your project stakeholders
          </p>
        </div>
        <Button className="mt-2 bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
          <Plus className="w-4 h-4" />
          Add Stakeholder
        </Button>
      </div>
    </div>
  );
}
