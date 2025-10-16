"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteChat } from "@/lib/db/actions";

export function ChatHeader({ id }: { id?: string }) {
  return (
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
  );
}
