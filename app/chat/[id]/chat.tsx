"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { MyUIMessage } from "@/lib/message-type";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: MyUIMessage[] } = {}) {
  const [input, setInput] = useState("");
  const { status, messages, setMessages, sendMessage } = useChat<MyUIMessage>({
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

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <ChatHeader id={id} />
      <MessageList
        messages={messages}
        status={status}
        setMessages={setMessages}
      />
      <ChatInput
        status={status}
        input={input}
        setInput={setInput}
        onSubmit={() => {
          sendMessage({ parts: [{ text: input, type: "text" }] });
          setInput("");
        }}
      />
    </div>
  );
}
