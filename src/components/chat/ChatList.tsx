import React, { useRef, useEffect } from "react";
import { FlatList, StyleSheet, View, ViewStyle, ListRenderItem } from "react-native";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { Message } from "../../types/index";
import { ChatBubble } from "./ChatBubble";
import { EmptyState } from "../ui/empty-state";

interface ChatListProps {
  messages: Message[];
  currentUserId: string;
  style?: ViewStyle;
}

export function ChatList({
  messages,
  currentUserId,
  style,
}: ChatListProps) {
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    // Scroll to bottom when messages change (new message added)
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage: ListRenderItem<Message> = ({ item }) => (
    <ChatBubble
      message={item}
      isOwnMessage={item.senderId === currentUserId}
      style={styles.bubble}
    />
  );

  const keyExtractor = (item: Message) => item._id;

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }}
      ListEmptyComponent={
        <EmptyState
          title="No messages yet"
          subtitle="Start the conversation by sending a message"
          variant="chat"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubble: {
    marginBottom: spacing[2],
  },
});
