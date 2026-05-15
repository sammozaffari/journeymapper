"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Map, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJourneyMaps } from "@/hooks/use-journey-maps";

export default function JourneyMapsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { maps, loading, createMap, deleteMap } = useJourneyMaps(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [mapName, setMapName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!mapName.trim()) return;
    setCreating(true);
    const map = await createMap(mapName.trim());
    if (map) {
      setCreateOpen(false);
      setMapName("");
      router.push(`/project/${projectId}/map/${map.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Journey Maps</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your service blueprints and journey maps
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
                <Plus className="w-4 h-4" />
                New Map
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-medium text-xl">
                Create journey map
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Map name
                </Label>
                <Input
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="e.g., Customer Onboarding Journey"
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={creating || !mapName.trim()}
                >
                  {creating ? "Creating..." : "Create Map"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : maps.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Map className="w-7 h-7 text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-xl">No journey maps yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first journey map to start visualizing your
              customer&apos;s experience
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-2 bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Map
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((map) => (
            <button
              key={map.id}
              onClick={() => router.push(`/project/${projectId}/map/${map.id}`)}
              className="group text-left"
            >
              <Card className="border-border/50 hover:border-brand/30 transition-all duration-200 hover:shadow-lg hover:shadow-brand/5 h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                        <Map className="w-4 h-4 text-brand" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{map.name}</h3>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          v{map.version} &middot; {map.mode}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMap(map.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    Updated{" "}
                    {formatDistanceToNow(new Date(map.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
