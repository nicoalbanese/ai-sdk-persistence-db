import { upsertMessage, loadChat } from "@/lib/db/actions";
import { openai } from "@ai-sdk/openai";
import {
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  createIdGenerator,
  UIMessage,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // get the last message from the client:
  const { message, chatId }: { message: UIMessage; chatId: string } =
    await req.json();

  // create or update last message in database
  await upsertMessage({ chatId, id: message.id, message });

  // load the previous messages from the server:
  const previousMessages = await loadChat(chatId);

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: previousMessages.map((m) => ({ ...m, content: "" }) as UIMessage),
    message,
  });

  // immediately start streaming (solves RAG issues with status, etc.)
  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        toolCallStreaming: true,
        maxSteps: 5, // multi-steps for server-side tools
        tools: {
          // server-side tool with execute function:
          getWeatherInformation: tool({
            description: "show the weather in a given city to the user",
            parameters: z.object({ city: z.string() }),
            execute: async ({ city }: { city: string }) => {
              // Add artificial delay of 2 seconds
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const weatherOptions = [
                "sunny",
                "cloudy",
                "rainy",
                "snowy",
                "windy",
              ];

              const weather =
                weatherOptions[
                  Math.floor(Math.random() * weatherOptions.length)
                ];
              return { city, weather };
            },
          }),
          // client-side tool that is automatically executed on the client:
          getLocation: tool({
            description:
              "Get the user location. Always ask for confirmation before using this tool.",
            parameters: z.object({}),
          }),
        },
        // id format for server-side messages:
        experimental_generateMessageId: createIdGenerator({
          prefix: "msgs",
          size: 16,
        }),
        onStepFinish: async ({ response }) => {
          try {
            const newMessage = appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }).at(-1)!;

            await upsertMessage({
              id: newMessage.id,
              chatId: chatId,
              message: newMessage as UIMessage,
            });
          } catch (error) {
            console.error("Error in onStepFinish:", error);
          }
        },
      });
      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  });
}
