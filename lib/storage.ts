import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserRole } from "../src/types";

const KEYS = {
  USER_ROLE: "user_role",
  LAST_CONTRACT_ID: "last_contract_id",
} as const;

export const storage = {
  // User role management
  async setRole(role: UserRole): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_ROLE, role);
  },

  async getRole(): Promise<UserRole | null> {
    const role = await AsyncStorage.getItem(KEYS.USER_ROLE);
    return role as UserRole | null;
  },

  async clearRole(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_ROLE);
  },

  // Last contract ID (for deep linking)
  async setLastContractId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_CONTRACT_ID, id);
  },

  async getLastContractId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LAST_CONTRACT_ID);
  },

  async clearLastContractId(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.LAST_CONTRACT_ID);
  },

  // Clear all storage
  async clearAll(): Promise<void> {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
  },
};
