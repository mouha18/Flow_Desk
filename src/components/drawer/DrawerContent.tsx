import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { colors } from "../../constants/colors";
import type { Contract } from "../../types";

interface DrawerContentProps {
  contracts?: any[];
  userRole?: "freelancer" | "client";
  unreadCounts?: Record<string, number>;
  notificationUnreadCount?: number;
  onSignOut?: () => void;
}

interface SectionItem {
  label: string;
  icon?: string;
  onPress?: () => void;
  isActive?: boolean;
  badge?: number;
}

interface Section {
  title?: string;
  items: SectionItem[];
}

export function DrawerContent({ contracts = [], userRole = "freelancer", unreadCounts = {}, notificationUnreadCount = 0, onSignOut }: DrawerContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contracts: true,
    chat: false,
  });

  // Determine base path based on role
  const basePath = userRole === "freelancer" ? "/(freelancer)" : "/(client)";

  // Calculate total unread messages across all contracts
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path: string) => pathname?.includes(path);

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  // Get recent contracts (up to 5)
  const recentContracts = contracts.slice(0, 5);

  const renderBadge = (count: number) => {
    if (count <= 0) return null;
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
      </View>
    );
  };

  const renderItem = (item: SectionItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.item, item.isActive && styles.itemActive]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.itemLabel, item.isActive && styles.itemLabelActive]}>
        {item.label}
      </Text>
      {item.badge && item.badge > 0 ? renderBadge(item.badge) : null}
    </TouchableOpacity>
  );

  const getSectionKey = (title: string | undefined): string => {
    return (title ?? "").toLowerCase();
  };

  const renderSection = (section: Section, sectionIndex: number) => {
    const sectionKey = getSectionKey(section.title);
    return (
      <View key={sectionIndex} style={styles.section}>
        {section.title && (
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(sectionKey)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.title === "Chat" && totalUnreadCount > 0 && renderBadge(totalUnreadCount)}
            </View>
            <Text style={styles.sectionArrow}>
              {expandedSections[sectionKey] !== false ? "▼" : "▶"}
            </Text>
          </TouchableOpacity>
        )}
        {expandedSections[sectionKey] !== false &&
          section.items.map((item, idx) => renderItem(item, idx))}
      </View>
    );
  };

  const sections: Section[] = [
    {
      items: [
        {
          label: "Dashboard",
          icon: "🏠",
          isActive: isActive("/dashboard"),
          onPress: () => navigateTo(`${basePath}/dashboard`),
        },
        {
          label: userRole === "freelancer" ? "Earnings" : "My Services",
          icon: "💰",
          isActive: isActive("/invoices"),
          onPress: () => navigateTo(`${basePath}/invoices`),
        },
      ],
    },
    {
      title: "Contracts",
      items: [
        {
          label: "All Contracts",
          icon: "📄",
          isActive: isActive("/contracts") && !pathname?.includes("/contracts/"),
          onPress: () => navigateTo(`${basePath}/contracts`),
        },
        ...recentContracts.map((contract) => ({
          label: truncateTitle(contract.title),
          icon: "📋",
          isActive: isActive(`/contracts/${contract._id}`),
          onPress: () => navigateTo(`${basePath}/contracts/${contract._id}`),
        })),
      ],
    },
    {
      title: "Chat",
      items:
        recentContracts.length > 0
          ? recentContracts.slice(0, 3).map((contract) => ({
              label: `Chat: ${truncateTitle(contract.title, 20)}`,
              icon: "💬",
              isActive: isActive(`/chat/${contract._id}`),
              onPress: () => navigateTo(`${basePath}/chat/${contract._id}`),
              badge: unreadCounts[contract._id] || 0,
            }))
          : [
              {
                label: "No active chats",
                icon: "💬",
                onPress: () => {},
              },
            ],
    },
    {
      items: [
        {
          label: "Notifications",
          icon: "🔔",
          isActive: isActive("/notifications") && !pathname?.includes("/notifications/preferences"),
          onPress: () => navigateTo(`${basePath}/notifications`),
          badge: notificationUnreadCount,
        },
        {
          label: "Notification Settings",
          icon: "⚙️",
          isActive: isActive("/notifications/preferences"),
          onPress: () => navigateTo(`${basePath}/notifications/preferences`),
        },
      ],
    },
    {
      items: [
        {
          label: "Profile",
          icon: "👤",
          isActive: isActive("/profile"),
          onPress: () => navigateTo(`${basePath}/profile`),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FlowDesk</Text>
        <Text style={styles.headerSubtitle}>{userRole === "freelancer" ? "Freelancer" : "Client"}</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sections.map((section, idx) => renderSection(section, idx))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => {
            if (onSignOut) onSignOut();
          }}
        >
          <Text style={styles.footerItemText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.gray100,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionArrow: {
    fontSize: 10,
    color: colors.gray500,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.transparent,
  },
  itemActive: {
    backgroundColor: colors.primaryLight + "20",
    borderLeftColor: colors.primary,
  },
  itemLabel: {
    fontSize: 16,
    color: colors.gray700,
    flex: 1,
  },
  itemLabelActive: {
    color: colors.primary,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  footerItem: {
    paddingVertical: 8,
  },
  footerItemText: {
    fontSize: 14,
    color: colors.error,
  },
});
