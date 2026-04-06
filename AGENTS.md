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
| Runtime | React Native | 0.81.x |
| Language | TypeScript | 5.x |
| Routing | Expo Router | ~4.0.0 |
| Backend | Convex | ^1.17.0 |
| Auth | @convex-dev/auth | ^0.0.71 |
| Secure Storage | expo-secure-store | bundled |
| Push Notifications | expo-notifications | bundled |
| Local Database | expo-sqlite | ~15.1.4 |
| Preferences | @react-native-async-storage/async-storage | bundled |

---

## Critical Rules

### 1. NEVER Use Tailwind / NativeWind / react-native-css
These packages cause Metro transformer crashes on this Expo SDK version. Use only React Native `StyleSheet.create()` for all styling. All UI components are in `src/components/ui/`.

### 2. NEVER Call Navigation Methods During Render
`router.replace()` or `router.push()` called directly in component render body causes "Cannot update a component while rendering" errors. Always wrap navigation in `useEffect`.

**BAD:**
```typescript
// ❌ WRONG — causes setState during render error
if (isAuthenticated) {
  router.replace("/(freelancer)/dashboard");
}
```

**GOOD:**
```typescript
// ✅ CORRECT — use useEffect
useEffect(() => {
  if (isAuthenticated) {
    router.replace("/(freelancer)/dashboard");
  }
}, [isAuthenticated]);
```

### 3. Convex Auth Session Is Authoritative for User Identity
- Use `getAuthUserId(ctx)` from `@convex-dev/auth/server` in Convex functions — NOT `ctx.auth.getUserIdentity()`
- Use `useAuth()` hook (from `hooks/use-auth.ts`) on the frontend to get `isAuthenticated`, `user`, and `userRole`
- The `useAuth()` hook returns `user.role` from the `userRoles` table in Convex, NOT from AsyncStorage alone

### 4. Role Is Stored in Convex `userRoles` Table, Not Just AsyncStorage
- `userRoles` table: `{ userId, role: "freelancer" | "client", createdAt }`
- Role is set once during registration via `setUserRole` mutation
- Subsequent logins read role from Convex via the `me` query
- AsyncStorage is still used as a cache for quick local access

### 5. Schema Changes Require `npx convex dev`
After modifying `convex/schema.ts`, you MUST run `npx convex dev` to push the updated schema to Convex. The app will have mismatched types until this is done.

### 6. Password Provider Requires `flow` Parameter
When calling `signIn("password", {...})` from `@convex-dev/auth/react`, you MUST include:
- `flow: "signIn"` for login
- `flow: "signUp"` for registration

Missing `flow` causes the Password provider to fail silently.

---

## Code Structure

```
app/                          # Expo Router screens
  _layout.tsx                 # Root layout — ConvexAuthProvider wraps everything
  index.tsx                   # Entry point — redirects based on auth + role
  (auth)/                     # Auth flow (Stack)
    _layout.tsx
    login.tsx                 # Login screen
    register.tsx               # Registration screen
    role-select.tsx            # Role picker (freelancer/client)
  (freelancer)/               # Freelancer flow (Drawer)
    _layout.tsx                # Auth guard: redirects if not freelancer
    dashboard/index.tsx
    contracts/index.tsx
    notifications/index.tsx
    profile/index.tsx
  (client)/                   # Client flow (Drawer)
    _layout.tsx                # Auth guard: redirects if not client
    dashboard/index.tsx
    contracts/index.tsx
    notifications/index.tsx
    profile/index.tsx

convex/                       # Convex backend
  auth.ts                     # Convex Auth config (convexAuth + Password provider)
  auth.config.ts               # Auth configuration
  schema.ts                    # Database schema
  users.ts                     # User queries/mutations (me, registerPushToken, setUserRole, updateProfile)
  http.ts                     # HTTP actions (future)

hooks/                        # Custom React hooks
  use-auth.ts                  # Auth state: isAuthenticated, user, userRole
  use-push-notifications.ts    # Push notification setup

lib/
  storage.ts                   # AsyncStorage helpers (role, lastContractId)
  sqlite.ts                   # SQLite init (platform-aware: native vs web)

src/
  components/ui/              # Design system components
    button.tsx, card.tsx, badge.tsx, input.tsx, screen.tsx, typography.tsx
  constants/
    colors.ts                  # Color palette (includes role colors: freelancer, client)
    typography.ts              # Font sizes
    spacing.ts                 # Spacing scale
  types/
    index.ts                   # TypeScript types (AuthUser, Contract, Task, Message, Invoice, etc.)
```

---

## Convex Auth Pattern

### Backend Setup
```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
export const { auth, signIn, signOut, store } = convexAuth({ providers: [Password()] });

// convex/schema.ts
import { authTables } from "@convex-dev/auth/server";
export default defineSchema({
  ...authTables,
  // custom tables...
});
```

### Frontend Provider
```typescript
// app/_layout.tsx
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <RootLayoutNav />
    </ConvexAuthProvider>
  );
}
```

### Auth Actions (Frontend)
```typescript
import { useAuthActions } from "@convex-dev/auth/react";
const { signIn, signOut } = useAuthActions();

// Login
await signIn("password", { email, password, flow: "signIn" });

// Register
await signIn("password", { email, password, name, flow: "signUp" });

// Logout
await signOut();
```

---

## Frequent Errors and Fixes

### Error: "Failed to insert or update a document... Object contains extra field"
**Cause:** Trying to insert a field into a Convex table that doesn't have it in the validator.
**Fix:** Add the field to the schema in `convex/schema.ts`, then run `npx convex dev`.

### Error: "Cannot update a component while rendering a different component"
**Cause:** Calling `router.replace()` or `setState` directly in the render body.
**Fix:** Wrap navigation in `useEffect`. Use `useRef` to prevent re-triggering.

### Error: Metro crash / transformer error
**Cause:** Usually `react-native-css` or incompatible Tailwind packages.
**Fix:** Remove all Tailwind/NativeWind packages. Use plain `StyleSheet.create()`.

### Error: Auth session not updating after login
**Cause:** Login screen not reacting to `isAuthenticated` change.
**Fix:** Watch `isAuthenticated` and `user` from `useAuth()` with `useEffect`, navigate inside the effect.

### Error: User stays on login screen after successful signIn
**Cause:** No redirect after successful signIn — the login screen just called signIn but didn't navigate.
**Fix:** Use `useEffect` to watch `isAuthenticated` and redirect when it becomes `true`.

### Error: Layout guard redirects even when user is authenticated
**Cause:** `userRole` is `null` because it was read from AsyncStorage before it was synced, or layout checks role before `useAuth` finishes loading.
**Fix:** Layout guards should check `if (isLoading || user === undefined) return null;` before checking role.

### Error: Password provider silently fails
**Cause:** Missing `flow: "signIn"` or `flow: "signUp"` parameter.
**Fix:** Always include the `flow` parameter.

---

## Design System

All UI components use React Native `StyleSheet`. No Tailwind. Color constants are in `src/constants/colors.ts`:

- `colors.primary` — Main brand color (#007AFF)
- `colors.freelancer` — Freelancer role (#10B981, green)
- `colors.client` — Client role (#8B5CF6, purple)
- `colors.error`, `colors.success`, `colors.warning` — Semantic colors

Typography: `src/constants/typography.ts` (fontSizes)
Spacing: `src/constants/spacing.ts` (spacing scale)

---

## Convex Schema Notes

The `users` table comes from `authTables` and has a fixed schema. Do NOT add fields directly to it. Instead:
- For role → use the `userRoles` table
- For push tokens → use the `userPushTokens` table
- For app-specific user data → create a separate table

Tables created so far:
- `userRoles` — one role per user (upsert pattern)
- `userPushTokens` — push notification tokens
- `contracts`, `tasks`, `messages`, `invoices`, `notifications` — app data

---

## Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `./` (src/ and root files)
- `hooks/*` → `./hooks/`
- `lib/*` → `./lib/`

---

## Next Session Notes

Sprint 1 is complete. Sprint 2 will implement:
- `convex/contracts.ts` — create, list, accept, decline contracts
- `convex/tasks.ts` — task CRUD + timer
- `convex/messages.ts` — real-time chat
- UI screens for contract management, task tracking, and chat
