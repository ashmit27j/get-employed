"use client";
import { useEffect, useState } from "react";
import { getChatThread } from "@/server/actions/chats";
import { Chat, type ChatThreadView } from "./Chat";

/** The dock: the most recent chat, or a new one. */
export function AssistantPanel({ userName }: { userName: string }) {
  const [thread, setThread] = useState<ChatThreadView | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getChatThread()
      .then((t) => live && setThread(t))
      .catch(() => live && setThread(null));
    return () => {
      live = false;
    };
  }, []);
  if (thread === undefined)
    return (
      <p className="m-0 p-4 text-small text-ink-subtle" role="status">
        Loading your chat…
      </p>
    );
  return <Chat initial={thread} userName={userName} variant="dock" />;
}
