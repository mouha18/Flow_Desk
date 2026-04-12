import React, { useRef, useEffect } from "react";
import { FlatList, StyleSheet, View, Text, ViewStyle, ListRenderItem } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { spacing } from "../../constants/spacing";
import { Message } from "../../types/index";
import { ChatBubble } from "./ChatBubble";

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
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Start the conversation by sending a message
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.gray700,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: "center",
    paddingHorizontal: spacing[8],
  },
});
