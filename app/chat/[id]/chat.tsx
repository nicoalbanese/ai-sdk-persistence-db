"use client";

import { deleteChat, deleteMessage } from "@/lib/db/actions";
import { DefaultChatTransport, getToolName } from "ai";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Streamdown } from "streamdown";
import { useEffect, useRef, useState } from "react";
import { MyUIMessage } from "@/lib/message-type";
import { Weather } from "./weather";

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: MyUIMessage[] } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const { status, messages, setMessages, sendMessage, addToolResult } =
    useChat<MyUIMessage>({
      id, // use the provided chatId
      messages: initialMessages, // initial messages if provided
      transport: new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => {
          // send only the last message and chat id
          // we will then fetch message history (for our chatId) on server
          // and append this message for the full context to send to the model
          const lastMessage = messages[messages.length - 1];
          return {
            body: {
              message: lastMessage,
              chatId: id,
            },
          };
        },
      }),
    });

  useEffect(() => {
    if (status === "ready") {
      inputRef?.current?.focus();
    }
  }, [status]);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          Back
        </Link>
        <button
          onClick={async () => {
            if (id) {
              await deleteChat(id);
              redirect("/");
            }
          }}
          className="text-red-600 hover:text-red-800 ml-4"
        >
          Delete Chat
        </button>
      </div>
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
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    );
                  case "text":
                    return (
                      <div
                        key={m.id + "-part-" + i}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    );
                  case "data-weather":
                    return (
                      <Weather key={m.id + "-part-" + i} data={part.data} />
                    );
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
                  case "tool-getLocation":
                    return (
                      <div key={part.toolCallId}>
                        {part.state === "output-available" ? (
                          <div className="font-mono text-sm bg-zinc-200 dark:bg-zinc-800 w-fit px-1 rounded-sm">
                            Result: {part.output.location}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              addToolResult({
                                toolCallId: part.toolCallId,
                                output: { location: "London" },
                              })
                            }
                          >
                            Get location
                          </button>
                        )}
                      </div>
                    );
                  case "source-url":
                    return (
                      <div
                        key={m.id + "-part-" + i}
                        className="bg-blue-50 p-2 rounded border-l-4 border-blue-400"
                      >
                        <span className="text-xs text-blue-600 font-medium">
                          Source URL:
                        </span>
                        <a
                          href={part.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline text-sm mt-1"
                        >
                          {part.url}
                        </a>
                      </div>
                    );
                  case "source-document":
                    return (
                      <div
                        key={m.id + "-part-" + i}
                        className="bg-blue-50 p-2 rounded border-l-4 border-blue-400"
                      >
                        <span className="text-xs text-blue-600 font-medium">
                          Source Document:
                        </span>
                        <div className="text-sm mt-1 text-blue-800">
                          {part.title || "Document"}
                        </div>
                      </div>
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
                        "Are you sure you want to proceed? This will delete all subsequent messages.",
                      )
                    ) {
                      try {
                        await deleteMessage(m.id);
                        // Find the index of the current message
                        const messageIndex = messages.findIndex(
                          (msg) => msg.id === m.id,
                        );
                        // Remove this message and all subsequent ones
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ parts: [{ text: input, type: "text" }] });
            setInput("");
          }
        }}
      >
        <input
          ref={inputRef}
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 dark:border-zinc-800 dark:bg-zinc-900 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
        />
      </form>
    </div>
  );
}
