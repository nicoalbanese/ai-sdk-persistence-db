"use client";

import { useEffect, useRef } from "react";

export function ChatInput({
  status,
  input,
  setInput,
  onSubmit,
}: {
  status: string;
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "ready") {
      inputRef?.current?.focus();
    }
  }, [status]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          onSubmit();
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
  );
}
