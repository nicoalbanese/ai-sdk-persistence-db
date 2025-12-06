import { createChat, getChats } from "@/lib/db/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const chats = await getChats();

  async function createNewChat() {
    "use server";
    const id = await createChat();
    redirect(`/chat/${id}`);
  }

  return (
    <div className="max-w-md mx-auto py-24">
      <form action={createNewChat} className="mb-8">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New Chat
        </button>
      </form>

      <ul>
        {chats.map((chat) => (
          <li key={chat.id}>
            <Link
              href={`/chat/${chat.id}`}
              className="text-blue-600 hover:underline"
            >
              {chat.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
