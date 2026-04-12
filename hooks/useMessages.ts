import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Message } from "../src/types";
import { cacheMessages } from "../lib/sqlite";

// Default pagination: 50 messages per page, start from the beginning
export const defaultPaginationOpts = { numItems: 50, cursor: null as null | string };

export function useMessages(contractId: Id<"contracts"> | undefined) {
  const messages = useQuery(
    contractId ? api.messages.listByContract : "skip" as any,
    contractId ? { contractId, paginationOpts: defaultPaginationOpts } : undefined
  );
  const isLoading = messages === undefined;

  const sendMessage = useMutation(api.messages.send);
  const markChatRead = useMutation(api.messages.markChatRead);

  // Get unread count for this contract
  const unreadCount = useQuery(
    contractId ? api.messages.getUnreadCount : "skip" as any,
    contractId ? { contractId } : undefined
  );

  // Extract the page of messages from paginated result
  const messagesPage = messages?.page ?? [];

  // Cache messages to SQLite for offline access
  useEffect(() => {
    if (messagesPage.length > 0 && contractId) {
      (async () => {
        await cacheMessages(contractId as string, messagesPage as Message[]);
      })();
    }
  }, [messagesPage, contractId]);

  return {
    messages: messagesPage as Message[],
    isLoading,
    sendMessage,
    markChatRead,
    unreadCount: unreadCount ?? 0,
  };
}
