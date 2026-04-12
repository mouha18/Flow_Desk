# Sprint 1 — Foundation: Implementation Plan

**Goal:** Navigation skeleton, auth, Convex schema, and design system live. Every screen is reachable, no data yet.  
**Deliverable:** Login → Role select → Freelancer/Client dashboard (empty state). Push token registered on launch.

---

## Phase 1: Project Infrastructure Setup

### 1.1 Initialize Expo Project
```
- Run: npx create-expo-app@latest FlowDesk --template blank-typescript
- Or initialize in existing directory if project already exists
- Ensure expo-router is set up: npx expo install expo-router
- Update app.json for expo-router (scheme, expo-build-properties)
```

### 1.2 Install Dependencies
```bash
# Core dependencies
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install @react-navigation/bottom-tabs @react-navigation/drawer
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler react-native-reanimated

# Convex
npx expo install convex

# Storage
npx expo install @react-native-async-storage/async-storage
npx expo install expo-sqlite

# Notifications
npx expo install expo-notifications expo-device

# Styling (Tailwind v4 + NativeWind v5)
npx expo install tailwindcss@^4 nativewind@5.0.0-preview.2 react-native-css@0.0.0-nightly.5ce6396 @tailwindcss/postcss tailwind-merge clsx
```

### 1.3 Configure Tailwind/NativeWind
**Files to create/modify:**
- `postcss.config.mjs` - PostCSS config with @tailwindcss/postcss
- `metro.config.js` - Metro config with NativeWind
- `src/global.css` - Tailwind imports + platform fonts
- `src/tw/index.tsx` - CSS-wrapped components (View, Text, ScrollView, etc.)

---

## Phase 2: TypeScript Types & Convex Schema

### 2.1 Define TypeScript Types
**File:** `src/types/index.ts`

```typescript
export type UserRole = "freelancer" | "client";

export type ContractStatus = "pending" | "active" | "completed" | "declined";
export type PricingType = "fixed" | "hourly";
export type PaymentMethod = "stripe" | "naboo_orange" | "naboo_wave";
export type PaymentTiming = "now" | "later";
export type AiEmailTone = "formal" | "friendly" | "casual";

export type TaskStatus = "pending" | "running" | "completed";

export type NotificationType =
  | "contract_invite"
  | "contract_accepted"
  | "contract_declined"
  | "task_complete"
  | "invoice_received"
  | "payment_received"
  | "new_message";

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  pseudo: string;
  role: UserRole;
  pushToken: string | null;
  _creationTime: number;
}

export interface Contract {
  _id: Id<"contracts">;
  freelancerId: Id<"users">;
  clientId: Id<"users"> | null;
  clientEmail: string;
  clientName: string;
  clientPseudo: string;
  title: string;
  status: ContractStatus;
  pricingType: PricingType;
  fixedPrice: number | null;
  paymentTiming: PaymentTiming;
  paymentMethod: PaymentMethod;
  aiEmailTone: AiEmailTone;
  completionPercent: number;
  deliverableLink: string | null;
  _creationTime: number;
}

export interface Task {
  _id: Id<"tasks">;
  contractId: Id<"contracts">;
  title: string;
  status: TaskStatus;
  hourlyRate: number | null;
  startedAt: number | null;
  completedAt: number | null;
  timeSpent: number | null;
  _creationTime: number;
}

export interface LineItem {
  description: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}

export interface Invoice {
  _id: Id<"invoices">;
  contractId: Id<"contracts">;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  aiGenerated: boolean;
  notes: string | null;
  status: InvoiceStatus;
  paymentSimulated: boolean;
  _creationTime: number;
}

export interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  contractId: Id<"contracts"> | null;
  message: string;
  read: boolean;
  _creationTime: number;
}
```

### 2.2 Define Convex Schema
**File:** `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    pseudo: v.string(),
    role: v.union(v.literal("freelancer"), v.literal("client")),
    pushToken: v.optional(v.string()),
  })
    .index("by_email", ["email"]),

  contracts: defineTable({
    freelancerId: v.id("users"),
    clientId: v.optional(v.id("users")),
    clientEmail: v.string(),
    clientName: v.string(),
    clientPseudo: v.string(),
    title: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("declined")
    ),
    pricingType: v.union(v.literal("fixed"), v.literal("hourly")),
    fixedPrice: v.optional(v.number()),
    paymentTiming: v.union(v.literal("now"), v.literal("later")),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("naboo_orange"),
      v.literal("naboo_wave")
    ),
    aiEmailTone: v.union(v.literal("formal"), v.literal("friendly"), v.literal("casual")),
    completionPercent: v.number(),
    deliverableLink: v.optional(v.string()),
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  tasks: defineTable({
    contractId: v.id("contracts"),
    title: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed")
    ),
    hourlyRate: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
  })
    .index("by_contract", ["contractId"])
    .index("by_contract_status", ["contractId", "status"]),

  messages: defineTable({
    contractId: v.id("contracts"),
    senderId: v.id("users"),
    content: v.string(),
  })
    .index("by_contract", ["contractId"]),

  invoices: defineTable({
    contractId: v.id("contracts"),
    lineItems: v.array(
      v.object({
        description: v.string(),
        hours: v.optional(v.number()),
        rate: v.optional(v.number()),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    aiGenerated: v.boolean(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid")),
    paymentSimulated: v.boolean(),
  })
    .index("by_contract", ["contractId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    contractId: v.optional(v.id("contracts")),
    message: v.string(),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),
});
```

### 2.3 Configure Convex Auth
**File:** `convex/auth.config.ts`

```typescript
import { convexAuth } from "@convex-dev/auth";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export default convexAuth({
  providers: [Password],
});
```

**File:** `convex/auth.ts` (or in schema)

---

## Phase 3: Design System

### 3.1 Color Constants
**File:** `src/constants/colors.ts`

```typescript
export const colors = {
  // Primary
  primary: "#007AFF",
  primaryLight: "#4DA3FF",
  primaryDark: "#0055CC",
  
  // Secondary
  secondary: "#5856D6",
  
  // Semantic
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  
  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  
  // Role colors
  freelancer: "#10B981",
  client: "#8B5CF6",
};
```

### 3.2 Typography
**File:** `src/constants/typography.ts`

```typescript
import { Platform } from "react-native";

export const fontFamilies = {
  regular: Platform.select({ ios: "System", android: "Roboto" }),
  medium: Platform.select({ ios: "System", android: "Roboto-Medium" }),
  bold: Platform.select({ ios: "System", android: "Roboto-Bold" }),
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};
```

### 3.3 Spacing
**File:** `src/constants/spacing.ts`

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};
```

---

## Phase 4: Base UI Components

### 4.1 Button
**File:** `src/components/ui/button.tsx`
- Variants: primary, secondary, outline, ghost
- Sizes: sm, md, lg
- States: default, pressed, disabled, loading

### 4.2 Card
**File:** `src/components/ui/card.tsx`
- Standard card with shadow and rounded corners

### 4.3 Badge
**File:** `src/components/ui/badge.tsx`
- Status badges for tasks, contracts, notifications
- Variants: default, success, warning, error

### 4.4 Input
**File:** `src/components/ui/input.tsx`
- Text input with label, error state, placeholder

### 4.5 Screen
**File:** `src/components/ui/screen.tsx`
- Wrapper with ScrollView, safe area handling

### 4.6 Typography
**File:** `src/components/ui/typography.tsx`
- Heading, Text, Label components

---

## Phase 5: Navigation Structure

### 5.1 Root Layout
**File:** `app/_layout.tsx`
- Auth guard using Convex Auth session
- Role-based redirect (freelancer vs client)
- Stack navigator for auth screens
- Tab navigator for main app

### 5.2 Auth Screens
**Files:**
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/role-select.tsx`

### 5.3 Freelancer Navigator
**Files:**
- `app/(freelancer)/_layout.tsx` - Drawer + Tab navigator
- `app/(freelancer)/dashboard/index.tsx`
- `app/(freelancer)/contracts/index.tsx`
- `app/(freelancer)/notifications/index.tsx`
- `app/(freelancer)/profile/index.tsx`

### 5.4 Client Navigator
**Files:**
- `app/(client)/_layout.tsx` - Drawer + Tab navigator
- `app/(client)/dashboard/index.tsx`
- `app/(client)/contracts/index.tsx`
- `app/(client)/notifications/index.tsx`
- `app/(client)/profile/index.tsx`

---

## Phase 6: Storage & Notifications

### 6.1 AsyncStorage Helpers
**File:** `lib/storage.ts`

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_ROLE: "user_role",
  LAST_CONTRACT_ID: "last_contract_id",
} as const;

export const storage = {
  async setRole(role: "freelancer" | "client") {
    await AsyncStorage.setItem(KEYS.USER_ROLE, role);
  },
  
  async getRole(): Promise<"freelancer" | "client" | null> {
    const role = await AsyncStorage.getItem(KEYS.USER_ROLE);
    return role as "freelancer" | "client" | null;
  },
  
  async setLastContractId(id: string) {
    await AsyncStorage.setItem(KEYS.LAST_CONTRACT_ID, id);
  },
  
  async getLastContractId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LAST_CONTRACT_ID);
  },
};
```

### 6.2 SQLite Init
**File:** `lib/sqlite.ts`

```typescript
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function initSQLite() {
  db = await SQLite.openDatabaseAsync("flowdesk.db");
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_contracts (
      _id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS cached_tasks (
      _id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS cached_messages (
      _id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  
  return db;
}

export function getDb() {
  if (!db) throw new Error("SQLite not initialized");
  return db;
}
```

### 6.3 Push Token Registration
**File:** `hooks/usePushNotifications.ts`

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect } from "react";
import { useMutation } from "convex/react";

export function usePushNotifications() {
  const registerToken = useMutation("users:registerPushToken");
  
  useEffect(() => {
    async function register() {
      if (!Device.isDevice) return;
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") return;
      
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_CONVEX_PROJECT_ID,
        });
        
        await registerToken({ pushToken: token.data });
      } catch (error) {
        console.error("Failed to register push token:", error);
      }
    }
    
    register();
  }, []);
}
```

---

## Phase 7: Convex Users (Minimal for Sprint 1)

### 7.1 Users Convex Functions
**File:** `convex/users.ts`

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser } from "./_generated/dataModel";

// Get current user
export const me = query({
  args: {},
  returns: v.optional(v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.string(),
    pseudo: v.string(),
    role: v.union(v.literal("freelancer"), v.literal("client")),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    
    return user;
  },
});

// Register push token
export const registerPushToken = mutation({
  args: { pushToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    await ctx.db.patch("users", user._id, { pushToken: args.pushToken });
    return null;
  },
});
```

---

## File Structure (Sprint 1)

```
flowdesk/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── role-select.tsx
│   ├── (freelancer)/
│   │   ├── _layout.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── contracts/
│   │   │   └── index.tsx
│   │   ├── notifications/
│   │   │   └── index.tsx
│   │   └── profile/
│   │       └── index.tsx
│   ├── (client)/
│   │   ├── _layout.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── contracts/
│   │   │   └── index.tsx
│   │   ├── notifications/
│   │   │   └── index.tsx
│   │   └── profile/
│   │       └── index.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── input.tsx
│   │       ├── screen.tsx
│   │       └── typography.tsx
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── tw/
│   │   ├── index.tsx
│   │   └── image.tsx
│   └── types/
│       └── index.ts
├── convex/
│   ├── schema.ts
│   ├── auth.config.ts
│   └── users.ts
├── hooks/
│   └── usePushNotifications.ts
├── lib/
│   ├── storage.ts
│   └── sqlite.ts
├── global.css
├── postcss.config.mjs
└── metro.config.js
```

---

## Definition of Done Checklist

- [ ] App compiles and runs on Expo Go
- [ ] Login and Register screens work with Convex Auth
- [ ] Role selection persists to AsyncStorage
- [ ] Freelancer sees freelancer tab layout; client sees client tab layout
- [ ] All three navigation types (Stack, Tab, Drawer) are reachable
- [ ] Push token is stored in Convex after permission granted
