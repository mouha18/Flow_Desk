import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Send } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ChatInput({
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  style,
}: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmedText = text.trim();
    if (trimmedText && !disabled) {
      onSend(trimmedText);
      setText("");
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.container, style]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.gray400}
            multiline
            maxLength={1000}
            editable={!disabled}
          />
        </View>

        <Pressable
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Send
            size={20}
            color={canSend ? colors.white : colors.gray500}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    marginRight: spacing[3],
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  input: {
    fontSize: fontSizes.base,
    color: colors.gray900,
    minHeight: 24,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: colors.accent,
  },
});
