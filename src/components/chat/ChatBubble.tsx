import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Message } from "../../types/index";
import { Avatar } from "../ui/avatar";
import { Typography } from "../ui/typography";

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
          <Avatar name="U" size="sm" />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Typography
          variant="body"
          color={isOwnMessage ? colors.white : colors.gray900}
          style={styles.content}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          color={isOwnMessage ? (colors.white + "80") : colors.gray500}
          style={styles.timestamp}
        >
          {formatTimestamp(message._creationTime)}
        </Typography>
      </View>

      {isOwnMessage && (
        <View style={styles.avatar}>
          <Avatar name="Me" size="sm" variant="freelancer" />
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
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing[2],
  },
  bubble: {
    maxWidth: "70%",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
  },
  bubbleOwn: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: borderRadius.sm,
  },
  content: {
    lineHeight: fontSizes.base * 1.5,
  },
  timestamp: {
    marginTop: spacing[1],
    alignSelf: "flex-end",
  },
});
