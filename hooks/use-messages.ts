import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCallback } from "react";

// Query hooks
export function useMessages(contractId: string | null) {
  return useQuery(api.messages.listByContract, contractId ? { contractId } : "skip");
}

export function useUnreadCount() {
  return useQuery(api.messages.getUnreadCount);
}

// Mutation hooks
export function useSendMessage() {
  return useMutation(api.messages.send);
}

export function useMarkAsRead() {
  return useMutation(api.messages.markAsRead);
}

// Helper function for sending a message
export function useSendChatMessage() {
  const sendMessage = useSendMessage();

  return useCallback(async (data: {
    contractId: string;
    content: string;
  }) => {
    return sendMessage({
      contractId: data.contractId,
      content: data.content,
    });
  }, [sendMessage]);
}

// Helper for getting chat partner name
export function useChatPartner(contractId: string | null) {
  const messages = useMessages(contractId);
  
  // Get unique sender IDs from messages
  const partnerIds = messages?.results?.reduce((ids: string[], msg: any) => {
    if (!ids.includes(msg.senderId)) {
      ids.push(msg.senderId);
    }
    return ids;
  }, []) || []);

  return partnerIds[0] || null;
}