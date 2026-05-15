"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface WizardPhaseProps {
  projectId: string;
  phase: number;
  phaseName: string;
  phaseDescription: string;
  context: string;
  previousOutputs: Record<string, any>;
  onOutputGenerated: (output: any) => void;
  initialMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
  emptyStatePrompt: string;
  phaseIcon: LucideIcon;
}

export function WizardPhase({
  projectId,
  phase,
  phaseName,
  phaseDescription,
  context,
  previousOutputs,
  onOutputGenerated,
  initialMessages,
  onMessagesUpdate,
  emptyStatePrompt,
  phaseIcon: PhaseIcon,
}: WizardPhaseProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync messages to parent
  useEffect(() => {
    onMessagesUpdate?.(messages);
  }, [messages, onMessagesUpdate]);

  // Restore messages when switching phases
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else {
      setMessages([]);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          phase,
          messages: updatedMessages,
          previousOutputs,
          action: "chat",
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          phase,
          messages,
          previousOutputs,
          action: "generate",
        }),
      });

      if (!res.ok) throw new Error("Generate request failed");

      const data = await res.json();
      onOutputGenerated(data);
    } catch (err) {
      console.error("Generate error:", err);
    }

    setGenerating(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showGenerateButton = messages.length >= 3;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Chat area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                <PhaseIcon className="w-7 h-7 text-brand" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-xl tracking-tight">
                  {phaseName}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {emptyStatePrompt}
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-brand/15 text-foreground"
                    : "bg-card border border-border/30 text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
              </div>
              <div className="bg-card border border-border/30 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Generate button */}
      {showGenerateButton && (
        <div className="px-4 py-2 border-t border-border/30 bg-card/50">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleGenerate}
              disabled={generating || loading}
              className="w-full bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 gap-2"
              variant="outline"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating {phaseName.toLowerCase()} output...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate {phaseName} Output
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border/30 bg-background">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tell me about the ${phaseName.toLowerCase()}...`}
            rows={1}
            className="resize-none min-h-[44px] max-h-32 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-11 w-11 p-0 bg-brand text-brand-foreground hover:bg-brand/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
