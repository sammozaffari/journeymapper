"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateProjectDialogProps {
  onCreateProject: (name: string, description?: string) => Promise<any>;
  trigger?: React.ReactElement;
}

export function CreateProjectDialog({
  onCreateProject,
  trigger,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const project = await onCreateProject(name.trim(), description.trim() || undefined);

    if (project) {
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/project/${project.id}`);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium text-xl">
            Create new project
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="project-name"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Project name
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., E-commerce Checkout Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="project-desc"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Description
              <span className="text-muted-foreground/50 normal-case tracking-normal ml-1">
                (optional)
              </span>
            </Label>
            <Textarea
              id="project-desc"
              placeholder="Brief description of the project scope and goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
