import { Platform } from "react-native";

// Only import expo-sqlite on native platforms
// On web, we'll use a mock implementation
let db: any = null;

export async function initSQLite(): Promise<any> {
  if (db) return db;

  if (Platform.OS === "web") {
    // Mock implementation for web
    console.log("SQLite mock mode for web");
    db = {
      execAsync: async () => {},
      runAsync: async () => {},
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
    };
    return db;
  }

  const SQLite = await import("expo-sqlite");
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

export function getDb(): any {
  if (!db) {
    throw new Error("SQLite not initialized. Call initSQLite() first.");
  }
  return db;
}

// Cache helpers
export async function cacheContract(contract: { _id: string; [key: string]: unknown }): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_contracts (_id, data, updated_at) VALUES (?, ?, ?)`,
    [contract._id, JSON.stringify(contract), Date.now()]
  );
}

export async function getCachedContract(id: string): Promise<unknown | null> {
  const database = getDb();
  const result = await database.getFirstAsync(
    `SELECT data FROM cached_contracts WHERE _id = ?`,
    [id]
  ) as { data: string } | null | undefined;
  return result ? JSON.parse(result.data) : null;
}

export async function cacheTask(task: { _id: string; contractId: string; [key: string]: unknown }): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_tasks (_id, contract_id, data, updated_at) VALUES (?, ?, ?, ?)`,
    [task._id, task.contractId, JSON.stringify(task), Date.now()]
  );
}

export async function getCachedTasksByContract(contractId: string): Promise<unknown[]> {
  const database = getDb();
  const results = await database.getAllAsync(
    `SELECT data FROM cached_tasks WHERE contract_id = ?`,
    [contractId]
  ) as { data: string }[];
  return results.map((r) => JSON.parse(r.data));
}

export async function cacheMessage(message: { _id: string; contractId: string; [key: string]: unknown }): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_messages (_id, contract_id, data, updated_at) VALUES (?, ?, ?, ?)`,
    [message._id, message.contractId, JSON.stringify(message), Date.now()]
  );
}

export async function getCachedMessagesByContract(contractId: string): Promise<unknown[]> {
  const database = getDb();
  const results = await database.getAllAsync(
    `SELECT data FROM cached_messages WHERE contract_id = ? ORDER BY updated_at ASC`,
    [contractId]
  ) as { data: string }[];
  return results.map((r) => JSON.parse(r.data));
}
