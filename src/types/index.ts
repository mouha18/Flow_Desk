// KEEP IN SYNC WITH convex/schema.ts
// This file manually mirrors the Convex schema for frontend TypeScript support.
// When schema.ts changes, update this file accordingly.

// User Types
export type UserRole = "freelancer" | "client";

// Auth user returned by the me query
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

// Full user (from database, not used by me query)
export interface User {
  _id: string;
  name: string;
  email: string;
  pseudo: string;
  role: UserRole;
  pushToken: string | null;
  _creationTime: number;
}

// Contract Types - FIXED
export type ContractStatus = "pending" | "active" | "completed" | "declined" | "finished" | "disputed";
export type PricingType = "fixed" | "hourly";
export type PaymentMethod = "stripe" | "naboo_orange" | "naboo_wave";
export type PaymentTiming = "now" | "later";
export type AiEmailTone = "formal" | "friendly" | "casual";
export type EscrowStatus = "held" | "delivered" | "released" | "refunded";

export interface Deliverable {
  name: string;
  url: string;
}

export interface Contract {
  _id: string;
  freelancerId: string;
  clientId?: string;
  clientEmail: string;
  clientName?: string;
  clientPseudo?: string;
  title: string;
  status: ContractStatus;
  escrowStatus?: EscrowStatus;
  escrowPaidAt?: number;
  escrowReleasedAt?: number;
  pricingType: PricingType;
  fixedPrice?: number;
  hourlyRate?: number;
  paymentTiming: PaymentTiming;
  paymentMethod: PaymentMethod;
  aiEmailTone: AiEmailTone;
  completionPercent: number;
  deliverableLink?: string;
  deliverables?: Deliverable[];
  freelancerName?: string;
  _creationTime: number;
}

// Task Types
export type TaskStatus = "pending" | "running" | "completed";

export interface Task {
  _id: string;
  contractId: string;
  title: string;
  status: TaskStatus;
  startedAt: number | null;
  completedAt: number | null;
  timeSpent: number | null;
  _creationTime: number;
}

// Message Types
export interface Message {
  _id: string;
  contractId: string;
  senderId: string;
  content: string;
  _creationTime: number;
}

// Invoice Types
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface LineItem {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}

export interface Invoice {
  _id: string;
  contractId: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  aiGenerated: boolean;
  notes: string | null;
  status: InvoiceStatus;
  paymentSimulated: boolean;
  deliverables?: Deliverable[];
  _creationTime: number;
}

// Notification Types
export type NotificationType =
  | "contract_invite"
  | "contract_accepted"
  | "contract_declined"
  | "task_complete"
  | "invoice_received"
  | "payment_received"
  | "new_message"
  | "time_tracked"
  | "project_complete"
  | "deliverable_released";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  contractId: string | null;
  message: string;
  read: boolean;
  _creationTime: number;
}

// Session/Auth Types
export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}
