import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function useUnreadCountsByContract() {
  // Always call useQuery unconditionally (Rules of Hooks).
  // Server-side getUnreadCountsByContract returns {} when not authenticated.
  const unreadCounts = useQuery(api.messages.getUnreadCountsByContract);
  return (unreadCounts ?? {}) as Record<string, number>;
}
