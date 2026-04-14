import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Typography, Heading, Screen, Avatar, Icon } from "@/components/ui";
import { useContracts } from "@/hooks/useContracts";
import { useUnreadCountsByContract } from "@/hooks/useUnreadCounts";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { Bell } from "lucide-react-native";
import type { Contract } from "@/types";

export default function FreelancerMessagesScreen() {
  const router = useRouter();
  const { contracts, isLoading } = useContracts();
  const unreadCounts = useUnreadCountsByContract();
  const notificationUnreadCount = useQuery(api.notifications.unreadCount) ?? 0;

  // Only show active contracts (those with potential chat)
  const activeContracts = (contracts as Contract[]).filter(
    (c) => c.status === "active" || c.status === "completed"
  );

  const handleConversationPress = (contractId: string) => {
    router.push(`/(freelancer)/chat/${contractId}` as any);
  };

  const renderConversation = ({ item }: { item: Contract }) => {
    const unreadCount = unreadCounts[item._id] || 0;
    const clientName = item.clientDisplayName || item.clientEmail || "Client";

    return (
      <TouchableOpacity
        style={styles.conversationRow}
        onPress={() => handleConversationPress(item._id)}
        activeOpacity={0.7}
      >
        <Avatar name={clientName} size="md" variant="client" />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Typography
              variant="body"
              style={[styles.contractTitle, unreadCount > 0 && styles.unreadTitle]}
              numberOfLines={1}
            >
              {item.title}
            </Typography>
          </View>
          <Typography
            variant="bodySmall"
            color={colors.gray500}
            numberOfLines={1}
            style={styles.clientName}
          >
            {clientName}
          </Typography>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Typography variant="caption" color={colors.white} style={styles.unreadText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Typography>
          </View>
        )}
        <Icon name="chevron-right" size="sm" color={colors.gray400} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Messages",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(freelancer)/notifications" as any)}
              style={styles.bellButton}
            >
              <Bell size={22} color={colors.gray700} strokeWidth={2} />
              {notificationUnreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Typography variant="caption" color={colors.white} style={styles.bellBadgeText}>
                    {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <Screen style={styles.container} scrollable={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading conversations…
            </Typography>
          </View>
        ) : activeContracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="message-circle" size="xl" color={colors.accent} />
            </View>
            <Heading level="h3" style={styles.emptyTitle}>
              No conversations yet
            </Heading>
            <Typography variant="bodySmall" color={colors.gray500} style={styles.emptyText}>
              Start a conversation by creating a contract with a client.
            </Typography>
          </View>
        ) : (
          <FlatList
            data={activeContracts}
            keyExtractor={(item) => item._id}
            renderItem={renderConversation}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: spacing[2],
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    columnGap: spacing[3],
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contractTitle: {
    flex: 1,
    marginRight: spacing[2],
    fontWeight: "500",
  },
  unreadTitle: {
    fontWeight: "700",
    color: colors.gray900,
  },
  clientName: {
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: spacing[1],
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray100,
    marginLeft: 76, // spacing[4](16) + avatar md(48) + gap(12)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[8],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: spacing[2],
  },
  emptyText: {
    textAlign: "center",
  },
  bellButton: {
    marginRight: spacing[2],
    padding: spacing[1],
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
});
