import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing, shadows } from "../../constants/spacing";
import { Contract, ContractStatus } from "../../types/index";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Typography } from "../ui/typography";

interface ContractCardProps {
  contract: Contract;
  onPress?: (contract: Contract) => void;
  style?: ViewStyle;
  completionPercent?: number;
  viewerRole?: "freelancer" | "client";
  freelancerName?: string;
}

const statusBadgeVariant: Record<ContractStatus, "default" | "success" | "warning" | "error"> = {
  pending: "warning",
  active: "success",
  completed: "default",
  declined: "error",
  finished: "default",
  disputed: "error",
};

const statusLabels: Record<ContractStatus, string> = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  declined: "Declined",
  finished: "Finished",
  disputed: "Disputed",
};

export function ContractCard({ contract, onPress, style, completionPercent: completionPercentProp, viewerRole, freelancerName }: ContractCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(contract);
  };

  // Use prop if provided, otherwise fall back to contract's value
  const displayPercent = completionPercentProp ?? contract.completionPercent ?? 0;

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.container, style]}>
        <View style={styles.header}>
          <Typography variant="body" style={styles.title} numberOfLines={1}>
            {contract.title}
          </Typography>
          <Badge
            label={statusLabels[contract.status]}
            variant={statusBadgeVariant[contract.status]}
          />
        </View>

        {/* Show freelancer name for client view, client name for freelancer view */}
        <View style={styles.clientInfo}>
          <Typography variant="bodySmall" color={colors.gray600}>
            {viewerRole === "client" && freelancerName
              ? freelancerName
              : (contract as any).clientDisplayName || contract.clientName || contract.clientPseudo || contract.clientEmail}
          </Typography>
        </View>

        <View style={styles.footer}>
          <View style={styles.pricing}>
            <Typography variant="caption" color={colors.gray500} style={styles.pricingLabel}>
              {contract.pricingType === "fixed" ? "Fixed Price" : "Hourly"}
            </Typography>
            <Typography variant="body" style={styles.pricingValue}>
              {contract.pricingType === "fixed"
                ? `${contract.fixedPrice?.toFixed(2) || "0.00"}`
                : contract.hourlyRate != null
                  ? `${contract.hourlyRate.toFixed(2)}/hr`
                  : "Hourly"}
            </Typography>
          </View>

          <View style={styles.completion}>
            <Typography variant="caption" color={colors.gray500} style={styles.completionLabel}>
              Progress
            </Typography>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${displayPercent}%` },
                ]}
              />
            </View>
            <Typography variant="bodySmall" color={colors.gray700} style={styles.completionValue}>
              {displayPercent}%
            </Typography>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
    flex: 1,
    marginRight: spacing[3],
  },
  clientInfo: {
    marginBottom: spacing[4],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  pricing: {
    flex: 1,
  },
  pricingLabel: {
    marginBottom: spacing[1],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pricingValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  completion: {
    flex: 1,
    alignItems: "flex-end",
  },
  completionLabel: {
    marginBottom: spacing[1],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing[1],
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  completionValue: {
    fontWeight: fontWeights.medium,
  },
});
