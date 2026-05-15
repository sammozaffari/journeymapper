"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GuidedConversationProps {
  projectId: string;
  onMapGenerated?: (mapData: any) => void;
}

export function GuidedConversation({
  projectId,
  onMapGenerated,
}: GuidedConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingMap, setGeneratingMap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: updatedMessages,
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

  async function handleGenerateMap() {
    setGeneratingMap(true);

    try {
      const conversationContext = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");

      const res = await fetch("/api/ai/generate-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          context: conversationContext,
        }),
      });

      if (res.ok) {
        const mapData = await res.json();
        onMapGenerated?.(mapData);
      }
    } catch (err) {
      console.error("Map generation error:", err);
    }

    setGeneratingMap(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-400/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-xl">AI Journey Guide</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  I&apos;ll help you map your customer&apos;s journey through a
                  structured conversation. Tell me about the service or
                  experience you want to map.
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
                <div className="w-7 h-7 rounded-lg bg-violet-400/15 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
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
              <div className="w-7 h-7 rounded-lg bg-violet-400/15 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
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

      {/* Generate map button */}
      {messages.length >= 6 && (
        <div className="px-4 py-2 border-t border-border/30 bg-card/50">
          <Button
            onClick={handleGenerateMap}
            disabled={generatingMap}
            className="w-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 gap-2"
            variant="outline"
          >
            {generatingMap ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating service blueprint...
              </>
            ) : (
              <>
                <Map className="w-4 h-4" />
                Generate Service Blueprint from Conversation
              </>
            )}
          </Button>
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
            placeholder="Describe the service or experience you want to map..."
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
