import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Message } from "../../types/index";

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  style?: ViewStyle;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({
  message,
  isOwnMessage,
  style,
}: ChatBubbleProps) {
  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.containerOwn : styles.containerOther,
        style,
      ]}
    >
      {!isOwnMessage && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text style={[styles.content, isOwnMessage && styles.contentOwn]}>
          {message.content}
        </Text>
        <Text style={[styles.timestamp, isOwnMessage && styles.timestampOwn]}>
          {formatTimestamp(message._creationTime)}
        </Text>
      </View>

      {isOwnMessage && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing[3],
  },
  containerOwn: {
    justifyContent: "flex-end",
  },
  containerOther: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing[2],
  },
  avatarText: {
    fontSize: fontSizes.sm,
  },
  bubble: {
    maxWidth: "70%",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: borderRadius.sm,
  },
  content: {
    fontSize: fontSizes.base,
    color: colors.gray900,
    lineHeight: fontSizes.base * 1.5,
  },
  contentOwn: {
    color: colors.white,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: spacing[1],
    alignSelf: "flex-end",
  },
  timestampOwn: {
    color: colors.white + "80",
  },
});