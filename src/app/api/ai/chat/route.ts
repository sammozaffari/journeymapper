import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { GUIDED_CONVERSATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { isMockMode } from "@/lib/ai/mock-wrapper";
import { MOCK_CHAT_RESPONSES } from "@/lib/ai/mock-data";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const requestSchema = z.object({
  projectId: z.string().uuid(),
  messages: z.array(messageSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = parsed.data;

    if (isMockMode()) {
      const index = Math.min(
        Math.floor(messages.length / 2),
        MOCK_CHAT_RESPONSES.length - 1
      );
      const mockText = MOCK_CHAT_RESPONSES[index];

      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            for (const char of mockText) {
              controller.enqueue(encoder.encode(char));
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const formattedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      system: GUIDED_CONVERSATION_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(
                  new TextEncoder().encode(event.delta.text)
                );
              }
            }
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: "Chat failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
