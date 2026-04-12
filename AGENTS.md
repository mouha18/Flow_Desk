# FlowDesk — Agent Guidelines

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.
When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first**.
<!-- convex-ai-end -->

---

## Project Overview

**FlowDesk** is a React Native + Expo mobile app (freelancer management platform) with a Convex backend. It connects freelancers and clients through contracts, tasks, real-time chat, and AI-generated invoices.

- **Frontend:** React Native (Expo managed workflow), TypeScript, Expo Router (file-based routing)
- **Backend:** Convex (real-time database + auth)
- **Styling:** Plain React Native `StyleSheet` — NO Tailwind, NO NativeWind (causes Metro crashes)
- **State:** Convex queries/mutations + React hooks; AsyncStorage for role/preferences; expo-sqlite for offline cache

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo (managed) | SDK 54 |
| Runtime | React Native | 0.81.5 |
| Language | TypeScript | 5.x |
| Routing | Expo Router | ~6.0.23 |
| Backend | Convex | ^1.17.0 |
| Auth | @convex-dev/auth | ^0.0.71 |
| Secure Storage | expo-secure-store | ~15.0.8 |
| Haptics | expo-haptics | ~15.0.8 |
| WebView | react-native-webview | ^13.15.0 |
| Push Notifications | expo-notifications | ~0.32.16 |
| Local Database | expo-sqlite | ~16.0.10 |
| Preferences | @react-native-async-storage/async-storage | 2.2.0 |

---

## Quick Reference

### Critical Rules

| Rule | Description |
|------|-------------|
| **No Tailwind/NativeWind** | Use only `StyleSheet.create()` — causes Metro crashes |
| **No navigation during render** | Wrap `router.replace()`/`router.push()` in `useEffect` |
| **Auth session is authoritative** | Use `getAuthUserId(ctx)` in Convex, `useAuth()` on frontend |
| **Role in Convex, not AsyncStorage** | Read from `userRoles` table via `me` query |
| **Schema changes require `npx convex dev`** | Push schema updates to Convex |
| **Password flow requires `flow` param** | `flow: "signIn"` or `flow: "signUp"` |

### Auth Pattern (Quick)

```typescript
// Login
await signIn("password", { email, password, flow: "signIn" });

// Register
await signIn("password", { email, password, name, flow: "signUp" });

// Logout
await signOut();
```

### Error Fixes

| Error | Fix |
|-------|-----|
| "Object contains extra field" | Add field to `convex/schema.ts`, run `npx convex dev` |
| "Cannot update a component while rendering" | Wrap navigation in `useEffect` |
| Metro crash | Remove Tailwind/NativeWind, use `StyleSheet` |
| Auth session not updating | Watch `isAuthenticated` with `useEffect`, navigate inside |
| Layout guard false redirect | Check `if (isLoading \|\| user === undefined) return null;` |
| Password silently fails | Always include `flow` parameter |

---

<!-- additional-start -->

## Backend (Convex)

### Documentation
- **Convex AI Guidelines:** `convex/_generated/ai/guidelines.md` (read first for Convex code)
- **Schema (source of truth):** [`convex/schema.ts`](convex/schema.ts)
- **API Design:** `docs/API_CONTRACT.md`
- **Architecture:** `docs/ARCHITECTURE.md`

### Convex Auth Setup

**Files:** [`convex/auth.ts`](convex/auth.ts) | [`convex/auth.config.ts`](convex/auth.config.ts)

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
export const { auth, signIn, signOut, store } = convexAuth({ providers: [Password()] });
```

### User Queries/Mutations

**File:** [`convex/users.ts`](convex/users.ts)

Key functions:
- `me` — get current user with role
- `setUserRole` — set freelancer/client role
- `updateProfile` — update user profile

### Schema Tables

```typescript
// From authTables: users (do NOT add fields directly)
// Custom tables:
userRoles         // { userId, role: "freelancer" | "client", createdAt }
userPushTokens    // { userId, token, platform }
contracts         // { freelancerId, clientId, title, description, budget, status, ... }
tasks             // { contractId, title, description, status, dueDate, ... }
messages          // { contractId, senderId, content, ... }
invoices          // { contractId, freelancerId, clientId, amount, status, ... }
notifications     // { userId, type, title, body, read, ... }
```

---

## Frontend

### Routing Structure

```
app/
├── _layout.tsx              # Root: ConvexAuthProvider wraps everything
├── index.tsx               # Entry: redirects based on auth + role
├── (auth)/                 # Auth flow (Stack)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── role-select.tsx
├── (freelancer)/           # Freelancer flow (Drawer)
│   ├── _layout.tsx          # Auth guard
│   ├── dashboard/index.tsx
│   ├── contracts/
│   │   ├── index.tsx
│   │   ├── new.tsx
│   │   └── [id]/
│   │       ├── index.tsx
│   │       ├── tasks.tsx
│   │       ├── complete.tsx
│   │       └── invoice.tsx
│   ├── chat/[contractId].tsx
│   ├── notifications/
│   └── profile/index.tsx
└── (client)/               # Client flow (Drawer)
    ├── _layout.tsx          # Auth guard
    ├── dashboard/index.tsx
    ├── contracts/
    │   ├── index.tsx
    │   └── [id]/
    │       ├── index.tsx
    │       └── invoice.tsx
    ├── chat/[contractId].tsx
    ├── notifications/
    └── profile/index.tsx
```

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | [`hooks/use-auth.ts`](hooks/use-auth.ts) | Auth state: `isAuthenticated`, `user`, `userRole` |
| `useContracts` | [`hooks/useContracts.ts`](hooks/useContracts.ts) | Contract queries |
| `useTasks` | [`hooks/useTasks.ts`](hooks/useTasks.ts) | Task queries |
| `useMessages` | [`hooks/useMessages.ts`](hooks/useMessages.ts) | Chat messages |
| `useInvoice` | [`hooks/useInvoice.ts`](hooks/useInvoice.ts) | Invoice with payment simulation |
| `useNotifications` | [`hooks/useNotifications.ts`](hooks/useNotifications.ts) | Notification queries |

### UI Components

**Design System:** `src/components/ui/` (plain `StyleSheet`, no Tailwind)

| Component | File | Description |
|-----------|------|-------------|
| Button | [`button.tsx`](src/components/ui/button.tsx) | Primary action button |
| Card | [`card.tsx`](src/components/ui/card.tsx) | Container card |
| Badge | [`badge.tsx`](src/components/ui/badge.tsx) | Status/count badge |
| Input | [`input.tsx`](src/components/ui/input.tsx) | Text input field |
| Screen | [`screen.tsx`](src/components/ui/screen.tsx) | Safe area wrapper |
| Typography | [`typography.tsx`](src/components/ui/typography.tsx) | Text components |

### Constants

| Category | File |
|----------|------|
| Colors | [`src/constants/colors.ts`](src/constants/colors.ts) |
| Typography | [`src/constants/typography.ts`](src/constants/typography.ts) |
| Spacing | [`src/constants/spacing.ts`](src/constants/spacing.ts) |

---

## Design System

### Colors (`src/constants/colors.ts`)

```typescript
colors.primary     // #007AFF — Main brand
colors.freelancer  // #10B981 — Freelancer role (green)
colors.client      // #8B5CF6 — Client role (purple)
colors.error       // Error state
colors.success     // Success state
colors.warning     // Warning state
```

### Typography (`src/constants/typography.ts`)

Font sizes for headings, body, captions.

### Spacing (`src/constants/spacing.ts`)

Consistent spacing scale (xs, sm, md, lg, xl, xxl).

---

## Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `./` (src/ and root files)
- `hooks/*` → `./hooks/`
- `lib/*` → `./lib/`

<!-- additional-end -->

---

## Additional Documentation

| Document | Description |
|----------|-------------|
| `docs/README.md` | Project README |
| `docs/PRD.md` | Product Requirements |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/TECHNICAL_ROADMAP.md` | Technical implementation roadmap |
| `docs/IMPLEMENTATION_ROADMAP.md` | Sprint-by-sprint roadmap |
| `docs/DATABASE_SCHEMA.md` | Database schema details |
| `docs/API_CONTRACT.md` | API endpoints |
| `docs/API_DESIGN.md` | API design patterns |
| `docs/SECURITY.md` | Security considerations |
| `docs/USER_BLUEPRINT.md` | User personas |
