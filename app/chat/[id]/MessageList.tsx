"use client";

import { MemoizedMarkdown } from "./memoized-markdown";
import { Weather } from "./weather";
import { getToolName } from "ai";
import { MyUIMessage } from "@/lib/message-type";
import { deleteMessage } from "@/lib/db/actions";

export function MessageList({
  messages,
  status,
  setMessages,
}: {
  messages: MyUIMessage[];
  status: string;
  setMessages: React.Dispatch<React.SetStateAction<MyUIMessage[]>>;
}) {
  return (
    <div className="space-y-8">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          <span className="font-semibold text-sm">
            {m.role === "user" ? "User: " : "AI: "}
          </span>
          <div className="space-y-4">
            {m.parts.map((part, i) => {
              switch (part.type) {
                case "reasoning":
                  return (
                    <div key={m.id + "-part-" + i} className="text-zinc-400">
                      <label>Reasoning:</label>
                      <MemoizedMarkdown id={m.id} content={part.text} />
                    </div>
                  );
                case "text":
                  return (
                    <div
                      key={m.id + "-part-" + i}
                      className="prose dark:text-zinc-300"
                    >
                      <MemoizedMarkdown id={m.id} content={part.text} />
                    </div>
                  );
                case "data-weather":
                  return <Weather key={m.id + "-part-" + i} data={part.data} />;
                case "tool-getWeatherInformation":
                  return (
                    <details
                      key={`tool-${part.toolCallId}`}
                      className="relative p-2 rounded-lg bg-zinc-100 group"
                    >
                      <summary className="list-none cursor-pointer select-none flex justify-between items-center pr-2">
                        <span className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded-md font-mono text-zinc-900">
                          {getToolName(part)}
                        </span>
                        {part.state === "output-available" ? (
                          <span className="text-xs text-zinc-500 ml-2">
                            Click to expand
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 animate-pulse">
                            calling...
                          </span>
                        )}
                      </summary>
                      {part.state === "output-available" ? (
                        <div className="mt-4 bg-zinc-50 p-2">
                          <pre className="font-mono text-xs">
                            {JSON.stringify(part.output, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </details>
                  );
                default:
                  return null;
              }
            })}
          </div>
          {m.role === "user" && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={async () => {
                  if (
                    confirm(
                      "Are you sure you want to proceed? This will delete all subsequent messages."
                    )
                  ) {
                    try {
                      await deleteMessage(m.id);
                      const messageIndex = messages.findIndex(
                        (msg) => msg.id === m.id
                      );
                      setMessages((prev) => prev.slice(0, messageIndex));
                    } catch (error) {
                      console.error("Error deleting chat:", error);
                    }
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700 disabled:cursor-not-allowed"
                disabled={status === "streaming" || status === "submitted"}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
