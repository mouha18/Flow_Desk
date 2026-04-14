/**
 * Centralized route path constants for navigation.
 * Use these instead of hardcoded strings to avoid typos and enable easy refactoring.
 *
 * @example
 * import { ROUTES } from "@/constants/routes";
 * router.push(ROUTES.FREELANCER.DASHBOARD);
 */
export const ROUTES = {
  // Onboarding routes
  ONBOARDING: {
    WELCOME: "/(onboarding)/welcome",
  },

  // Auth routes
  AUTH: {
    LOGIN: "/(auth)/login",
    REGISTER: "/(auth)/register",
    ROLE_SELECT: "/(auth)/role-select",
    LEGAL: "/(auth)/legal",
  },

  // Freelancer routes
  FREELANCER: {
    DASHBOARD: "/(freelancer)/dashboard",
    CONTRACTS: "/(freelancer)/contracts",
    CONTRACTS_NEW: "/(freelancer)/contracts/new",
    CONTRACT_DETAIL: (id: string) => `/(freelancer)/contracts/${id}` as const,
    CONTRACT_TASKS: (id: string) => `/(freelancer)/contracts/${id}/tasks` as const,
    CONTRACT_INVOICE: (id: string) => `/(freelancer)/contracts/${id}/invoice` as const,
    CONTRACT_COMPLETE: (id: string) => `/(freelancer)/contracts/${id}/complete` as const,
    CHAT: (contractId: string) => `/(freelancer)/chat/${contractId}` as const,
    MESSAGES: "/(freelancer)/messages",
    INVOICES: "/(freelancer)/invoices",
    NOTIFICATIONS: "/(freelancer)/notifications",
    NOTIFICATIONS_PREFERENCES: "/(freelancer)/notifications/preferences",
    PROFILE: "/(freelancer)/profile",
  },

  // Client routes
  CLIENT: {
    DASHBOARD: "/(client)/dashboard",
    CONTRACTS: "/(client)/contracts",
    CONTRACT_DETAIL: (id: string) => `/(client)/contracts/${id}` as const,
    CONTRACT_INVOICE: (id: string) => `/(client)/contracts/${id}/invoice` as const,
    CHAT: (contractId: string) => `/(client)/chat/${contractId}` as const,
    MESSAGES: "/(client)/messages",
    INVOICES: "/(client)/invoices",
    NOTIFICATIONS: "/(client)/notifications",
    NOTIFICATIONS_PREFERENCES: "/(client)/notifications/preferences",
    PROFILE: "/(client)/profile",
  },
} as const;

export type OnboardingRoutes = typeof ROUTES.ONBOARDING;
export type AuthRoutes = typeof ROUTES.AUTH;
export type FreelancerRoutes = typeof ROUTES.FREELANCER;
export type ClientRoutes = typeof ROUTES.CLIENT;
