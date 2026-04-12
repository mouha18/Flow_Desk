import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Typography, Screen } from "@/components/ui";
import { ChatList } from "@/components/chat/ChatList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessages } from "@/hooks/useMessages";
import { useContractById } from "@/hooks/useContracts";
import { useAuth } from "@/hooks/use-auth";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";

export default function FreelancerChatScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const convId = contractId as Id<"contracts"> | undefined;
  const { messages, isLoading, sendMessage, markChatRead, unreadCount } = useMessages(convId);
  const { contract } = useContractById(convId);
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  // Mark chat as read when screen mounts
  useEffect(() => {
    if (convId && markChatRead) {
      markChatRead({ contractId: convId });
    }
  }, [convId, markChatRead]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !convId) return;
    try {
      setIsSending(true);
      await sendMessage({ contractId: convId, content });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: contract?.title || "Chat",
          headerLargeTitle: false,
        }}
      />
      <Screen scrollable={false} style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading messages...
            </Typography>
          </View>
        ) : (
          <ChatList
            messages={messages}
            currentUserId={user?._id || ""}
            style={styles.chatList}
          />
        )}
        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          style={styles.input}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatList: {
    flex: 1,
  },
  input: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
