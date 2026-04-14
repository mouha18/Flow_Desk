import React from "react";
import { ViewStyle } from "react-native";
import { Badge, BadgeVariant } from "./badge";

/**
 * Status types used across contracts, invoices, and tasks.
 */
export type StatusType =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "rejected"
  | "accepted"
  | "declined"
  | "draft"
  | "sent"
  | "paid"
  | "overdue";

/**
 * Mapping of status types to badge variants.
 */
const statusVariantMap: Record<StatusType, BadgeVariant> = {
  pending: "warning",
  active: "success",
  completed: "accent",
  cancelled: "error",
  rejected: "error",
  accepted: "success",
  declined: "error",
  draft: "default",
  sent: "accent",
  paid: "success",
  overdue: "error",
};

/**
 * Human-readable labels for status types.
 */
const statusLabels: Record<StatusType, string> = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  accepted: "Accepted",
  declined: "Declined",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

/**
 * A specialized badge component for displaying status values.
 * Maps status types to appropriate badge variants with human-readable labels.
 *
 * @example
 * // Contract status
 * <StatusBadge status="active" />
 *
 * // Invoice status
 * <StatusBadge status="paid" />
 *
 * // Task status
 * <StatusBadge status="pending" />
 */
export function StatusBadge({ status, style }: StatusBadgeProps) {
  const variant = statusVariantMap[status];
  const label = statusLabels[status];

  return <Badge label={label} variant={variant} style={style} />;
}

/**
 * Contract-specific statuses
 */
export type ContractStatus = "pending" | "active" | "completed" | "cancelled";

/**
 * Invoice-specific statuses
 */
export type InvoiceStatus = "draft" | "sent" | "pending" | "paid" | "overdue" | "cancelled";

/**
 * Task-specific statuses
 */
export type TaskStatus = "pending" | "active" | "completed";

/**
 * Helper function to get badge variant for a contract status
 */
export function getContractStatusVariant(status: ContractStatus): BadgeVariant {
  return statusVariantMap[status];
}

/**
 * Helper function to get badge variant for an invoice status
 */
export function getInvoiceStatusVariant(status: InvoiceStatus): BadgeVariant {
  return statusVariantMap[status];
}

/**
 * Helper function to get badge variant for a task status
 */
export function getTaskStatusVariant(status: TaskStatus): BadgeVariant {
  return statusVariantMap[status];
}
