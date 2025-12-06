import { loadChat } from "@/lib/db/actions";
import Chat from "./chat";

export const dynamic = 'force-dynamic';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages

  return <Chat id={id} initialMessages={messages} />; // display the chat
}
