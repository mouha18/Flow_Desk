import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Typography, Screen } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useContract } from "@/hooks/use-contracts";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";

export default function FreelancerChatScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const { messages, isLoading: messagesLoading } = useMessages(contractId || null);
  const { sendMessage } = useSendMessage();
  const { contract } = useContract(contractId || null);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!newMessage.trim() || !contractId) return;
    setIsSending(true);
    try {
      await sendMessage({
        contractId: contractId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Typography variant="body" style={isOwnMessage ? styles.ownText : styles.otherText}>
            {item.content}
          </Typography>
          <Typography variant="caption" style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {new Date(item._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
      </View>
    );
  };

  if (messagesLoading) {
    return (
      <>
        <Stack.Screen options={{ title: contract?.title || "Chat" }} />
        <Screen style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: contract?.clientName || "Chat" }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages?.results || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            placeholderTextColor={colors.gray400}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled
            ]}
          >
            <Typography variant="body" style={styles.sendButtonText}>
              Send
            </Typography>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  messagesList: {
    padding: spacing[4],
  },
  messageContainer: {
    marginBottom: spacing[3],
  },
  ownMessage: {
    alignItems: "flex-end",
  },
  otherMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: spacing[3],
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.gray900,
  },
  timestamp: {
    marginTop: spacing[1],
  },
  ownTimestamp: {
    color: colors.white + "CC",
    textAlign: "right",
  },
  otherTimestamp: {
    color: colors.gray500,
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing[3],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    maxHeight: 100,
    fontSize: 16,
    color: colors.gray900,
  },
  sendButton: {
    marginLeft: spacing[2],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});