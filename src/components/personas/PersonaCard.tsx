"use client";

import { UserCircle, Target, Frown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Persona {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  quotes: string[];
  is_ai_generated: boolean;
}

interface PersonaCardProps {
  persona: Persona;
  onClick?: () => void;
}

export function PersonaCard({ persona, onClick }: PersonaCardProps) {
  return (
    <Card
      className="border-border/50 hover:border-brand/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand/5 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-400/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">{persona.name}</h3>
              {persona.is_ai_generated && (
                <Badge
                  variant="secondary"
                  className="text-[9px] uppercase tracking-wider bg-violet-400/10 text-violet-400"
                >
                  AI
                </Badge>
              )}
            </div>
            {persona.role && (
              <p className="text-xs text-muted-foreground">{persona.role}</p>
            )}
          </div>
        </div>

        {persona.bio && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {persona.bio}
          </p>
        )}

        {persona.goals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Goals
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.goals.slice(0, 3).map((goal, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {persona.frustrations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
              <Frown className="w-3 h-3" />
              Frustrations
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.frustrations.slice(0, 3).map((f, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] font-normal bg-rose-400/5 text-rose-400/80"
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {persona.quotes.length > 0 && (
          <blockquote className="text-xs italic text-muted-foreground border-l-2 border-brand/30 pl-3">
            &ldquo;{persona.quotes[0]}&rdquo;
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}
