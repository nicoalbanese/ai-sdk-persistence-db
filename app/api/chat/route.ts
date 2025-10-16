import { tools } from "@/ai/tools";
import { upsertMessage, loadChat } from "@/lib/db/actions";
import { MyUIMessage } from "@/lib/message-type";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  createUIMessageStream,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStreamResponse,
  generateId,
  UIMessageStreamWriter,
} from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // get the last message from the client:
  const { message, chatId }: { message: MyUIMessage; chatId: string } =
    await req.json();

  // create or update last message in database
  await upsertMessage({ chatId, id: message.id, message });

  // load the previous messages from the server:
  const messages = await loadChat(chatId);

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // if the last message is a user message, create our own start step so we can start streaming data
      // if assistant message (e.g. adding tool result, we want to keep that as part of the previous step)
      if (message.role === "user") {
        writer.write({
          type: "start",
          messageId: generateId(),
        });
        writer.write({
          type: "start-step",
        });
      }

      // test persisting different chunk types
      // removed dummy chunks for source-url and source-document
      randomlyWriteChunks(writer);

      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        tools: tools(writer), // pass message writer into tools for writing custom data parts
      });

      result.consumeStream();
      writer.merge(result.toUIMessageStream({ sendStart: false }));
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      try {
        await upsertMessage({
          id: responseMessage.id,
          chatId,
          message: responseMessage,
        });
      } catch (error) {
        console.error(error);
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}

const randomlyWriteChunks = (writer: UIMessageStreamWriter) => {
  if (Math.random() > 0.5) {
    const reasoningId = generateId();
    writer.write({ type: "reasoning-start", id: reasoningId });
    writer.write({
      type: "reasoning-delta",
      delta: "This ",
      id: reasoningId,
    });
    writer.write({
      type: "reasoning-delta",
      delta: "is ",
      id: reasoningId,
    });
    writer.write({
      type: "reasoning-delta",
      delta: " some",
      id: reasoningId,
    });
    writer.write({
      type: "reasoning-delta",
      delta: " reasoning",
      id: reasoningId,
    });
    writer.write({ type: "reasoning-end", id: reasoningId });
  }

  // removed unsupported parts: source-url, source-document
};
