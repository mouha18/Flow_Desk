# Flowdesk

> The minimalist freelancer workspace — from contract to delivery, in one app.

## Overview

Flowdesk is a mobile-first project management platform built for freelancers and their clients. It covers the full work lifecycle: from sending a contract proposal to a client, through task management and real-time chat, to AI-generated invoicing and simulated payment confirmation with automatic deliverable release.

The app supports two distinct roles — **Freelancer** and **Client** — each with their own tailored dashboard, navigation, and notification flows. Freelancers manage their work pipeline; clients track their active projects, chat with their freelancer, and handle payments.

Flowdesk was built as a React Native mobile application using Convex for real-time backend sync, Anthropic's API for intelligent invoice generation and AI-composed emails, and Resend for transactional email delivery at key lifecycle moments.

## Features

- Role-based onboarding (Freelancer / Client)
- Contract creation with pricing type (Fixed / Hourly), payment method, and AI email tone selection
- AI-generated client outreach email via Anthropic API
- Client accept / decline flow with push and email notifications
- Task management with status tracking (Pending → Running → Completed) and per-task time tracking
- Hourly rate per task (disabled on fixed-price contracts)
- Automatic completion percentage calculation; client notified at 100%
- AI-generated invoice draft from project + task data, editable before sending
- Simulated payment flow (Stripe / NabooPay Orange Money / NabooPay Wave)
- Deliverable link released automatically on payment confirmation
- Real-time in-app chat between freelancer and client per contract
- Transactional emails via Resend at 3 key moments (accept, invoice, payment)
- Push and remote notifications via Expo Notifications + Convex
- Offline caching with SQLite and AsyncStorage
- Stack + Tab + Drawer navigation per role

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native + Expo (managed workflow) |
| Navigation | React Navigation (Stack, Tab, Drawer) |
| Backend & Realtime | Convex |
| Auth | Convex Auth |
| AI | Anthropic API (claude-sonnet-4-20250514) |
| Email | Resend |
| Local Persistence | expo-sqlite + AsyncStorage |
| Push Notifications | Expo Notifications + Convex |
| Payments | Simulated (Stripe / NabooPay UI mock) |
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
│   ├── (auth)/                 # Login, Register, Role selection
│   ├── (freelancer)/           # Freelancer-only screens
│   │   ├── dashboard/
│   │   ├── contracts/
│   │   ├── tasks/
│   │   ├── invoice/
│   │   └── chat/
│   ├── (client)/               # Client-only screens
│   │   ├── dashboard/
│   │   ├── contracts/
│   │   ├── invoice/
│   │   └── chat/
│   └── _layout.tsx             # Root layout + auth guard
├── components/                 # Reusable UI components
│   ├── ui/                     # Base design system (Button, Card, Badge, Input)
│   ├── contracts/              # Contract-specific components
│   ├── tasks/                  # Task-specific components
│   ├── invoice/                # Invoice-specific components
│   └── chat/                   # Chat-specific components
├── convex/                     # Convex backend
│   ├── schema.ts               # DB schema
│   ├── users.ts                # User mutations/queries
│   ├── contracts.ts            # Contract mutations/queries
│   ├── tasks.ts                # Task mutations/queries
│   ├── messages.ts             # Chat mutations/queries
│   ├── invoices.ts             # Invoice mutations/queries
│   ├── notifications.ts        # Notification mutations/queries
│   └── actions/                # Server-side actions (AI, email, push)
│       ├── ai.ts               # Anthropic API calls
│       ├── email.ts            # Resend email triggers
│       └── push.ts             # Expo push notification sender
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities (sqlite, storage, formatting)
│   ├── sqlite.ts               # SQLite cache layer
│   ├── storage.ts              # AsyncStorage helpers
│   └── formatting.ts           # Currency, date formatters
├── constants/                  # Colors, typography, spacing
├── types/                      # Shared TypeScript types
└── .env.example                # Environment variable reference
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Your Convex deployment URL | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | ✅ |
| `RESEND_API_KEY` | Resend API key for transactional email | ✅ |
| `EXPO_PUBLIC_CONVEX_URL` | Public Convex URL for client | ✅ |

## License

MIT
