# FlowDesk

> The minimalist freelancer workspace — from contract to delivery, in one app.

## Overview

FlowDesk is a mobile-first project management platform built for freelancers and their clients. It covers the full work lifecycle: from sending a contract proposal to a client, through task management and real-time chat, to AI-generated invoicing and simulated payment confirmation with automatic deliverable release.

The app supports two distinct roles — **Freelancer** and **Client** — each with their own tailored dashboard, navigation, and notification flows. Freelancers manage their work pipeline; clients track their active projects, chat with their freelancer, and handle payments.

FlowDesk was built as a React Native mobile application using Convex for real-time backend sync, Anthropic's API for intelligent invoice generation and AI-composed emails, and Resend for transactional email delivery at key lifecycle moments.

## Features

- **Role-based onboarding** (Freelancer / Client)
- **Contract management** with pricing type (Fixed / Hourly), payment method, AI email tone selection
- **AI-generated client outreach email** via Anthropic API
- **Client accept / decline flow** with push and email notifications
- **Escrow management** with held/delivered/released/refunded statuses
- **Task management** with status tracking (Pending → Running → Completed) and per-task time tracking
- **Real-time in-app chat** between freelancer and client per contract
- **Chat read status tracking** (unread message indicators)
- **AI-generated invoice draft** from project + task data, editable before sending
- **Multiple deliverables** per contract with links
- **Simulated payment flow** (Stripe / NabooPay Orange Money / NabooPay Wave)
- **Deliverable link released** automatically on payment confirmation
- **Notification preferences** per user (enable/disable specific notification types)
- **10 notification types**: contract_invite, contract_accepted, contract_declined, task_complete, invoice_received, payment_received, new_message, time_tracked, project_complete, deliverable_released
- **Transactional emails** via Resend at key lifecycle moments
- **Push and remote notifications** via Expo Notifications + Convex
- **Offline caching** with SQLite and AsyncStorage
- **Drawer navigation** per role with dashboard, contracts, chat, notifications, profile

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native + Expo (SDK 54, managed workflow) |
| Navigation | React Navigation (Drawer + Stack) with Expo Router |
| Backend & Realtime | Convex (^1.17.0) |
| Auth | @convex-dev/auth (^0.0.71) |
| AI | Anthropic API (claude-sonnet-4-20250514) |
| Email | Resend |
| Local Persistence | expo-sqlite + AsyncStorage |
| Push Notifications | expo-notifications |
| Payments | Simulated (Stripe / NabooPay UI mock) |
| Haptics | expo-haptics |
| WebView | react-native-webview |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- Convex account (convex.dev)
- Anthropic API key
- Resend API key
- Expo Go app (for physical device testing)

### Installation

```bash
git clone https://github.com/your-username/flowdesk.git
cd flowdesk
npm install
cp .env.example .env
# Fill in your keys in .env
npx convex dev
npx expo start
```

## Project Structure

```text
flowdesk/
├── app/                        # Expo Router screens
│   ├── _layout.tsx              # Root layout with ConvexAuthProvider
│   ├── index.tsx                # Entry point (auth + role redirect)
│   ├── (auth)/                  # Login, Register, Role selection, Legal
│   ├── (freelancer)/            # Freelancer-only screens
│   │   ├── _layout.tsx          # Auth guard + Drawer navigation
│   │   ├── dashboard/
│   │   ├── contracts/
│   │   │   ├── index.tsx        # Contract list
│   │   │   ├── new.tsx          # Create contract
│   │   │   └── [id]/            # Contract detail + sub-pages
│   │   │       ├── index.tsx
│   │   │       ├── tasks.tsx
│   │   │       ├── complete.tsx
│   │   │       └── invoice.tsx
│   │   ├── chat/
│   │   ├── notifications/
│   │   └── profile/
│   └── (client)/                # Client-only screens
│       ├── _layout.tsx
│       ├── dashboard/
│       ├── contracts/
│       ├── chat/
│       ├── notifications/
│       └── profile/
├── src/                         # Shared source code
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base design system (Button, Card, Badge, Input, etc.)
│   │   ├── contracts/           # Contract-specific components
│   │   ├── tasks/               # Task-specific components
│   │   ├── invoice/             # Invoice-specific components
│   │   ├── chat/                # Chat-specific components
│   │   ├── notifications/       # Notification components
│   │   └── drawer/              # Drawer navigation components
│   ├── constants/               # Colors, typography, spacing
│   └── types/                   # Shared TypeScript types
├── convex/                      # Convex backend
│   ├── schema.ts                # DB schema (tables + indexes)
│   ├── auth.ts                  # Convex Auth config
│   ├── auth.config.ts           # Auth configuration
│   ├── users.ts                 # User mutations/queries
│   ├── contracts.ts            # Contract mutations/queries
│   ├── tasks.ts                # Task mutations/queries
│   ├── messages.ts             # Chat mutations/queries
│   ├── invoices.ts             # Invoice mutations/queries
│   ├── notifications.ts         # Notification mutations/queries
│   ├── ai.ts                   # Anthropic API calls
│   ├── email.ts                # Resend email triggers
│   ├── pushInternal.ts         # Internal push helpers
│   └── actions/
│       └── push.ts             # Expo push notification sender
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts              # Auth state (isAuthenticated, user, userRole)
│   ├── use-contracts.ts        # Contract queries
│   ├── use-tasks.ts            # Task queries
│   ├── use-messages.ts         # Message queries
│   ├── use-invoice.ts          # Invoice queries
│   ├── use-notifications.ts    # Notification queries
│   └── use-push-notifications.ts
├── lib/                         # Utilities
│   ├── sqlite.ts                # SQLite cache layer
│   ├── storage.ts               # AsyncStorage helpers
│   ├── formatting.ts            # Currency, date formatters
│   └── index.ts
└── .env.example                 # Environment variable reference
```

## Database Tables

| Table | Description |
|---|---|
| `users` | Convex Auth user accounts |
| `userRoles` | Freelancer/Client role per user |
| `userPushTokens` | Expo push tokens per user |
| `userEmails` | Email lookup optimization |
| `chatReadStatus` | Last read timestamp per user/contract |
| `notificationPreferences` | Per-user notification settings |
| `contracts` | Contract records with escrow fields |
| `tasks` | Task records with time tracking |
| `messages` | Chat messages |
| `invoices` | Invoice records with line items |
| `notifications` | Notification records |

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Your Convex deployment URL | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | ✅ |
| `RESEND_API_KEY` | Resend API key for transactional email | ✅ |
| `EXPO_PUBLIC_CONVEX_URL` | Public Convex URL for client | ✅ |

## License

MIT
