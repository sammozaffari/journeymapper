"use client";

import { useState } from "react";
import { Settings, Users, CreditCard } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { createClient } from "@/lib/supabase/client";

export default function WorkspaceSettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const [name, setName] = useState(currentWorkspace?.name || "");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    if (!currentWorkspace || !name.trim()) return;
    setSaving(true);
    await supabase
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", currentWorkspace.id);
    setSaving(false);
  }

  return (
    <>
      <TopBar breadcrumbs={[{ label: "Workspace Settings" }]} />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl">Workspace Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace, team members, and billing
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4 text-muted-foreground" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Workspace name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-sm h-10"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber text-amber-foreground hover:bg-amber/90"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-muted-foreground" />
              Team Members
            </CardTitle>
            <CardDescription>
              Invite team members to collaborate on projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-border/60 rounded-lg p-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Team member management coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Plan & Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-amber/10 text-amber border-amber/20">
                {currentWorkspace?.plan || "free"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                You are on the free plan
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
