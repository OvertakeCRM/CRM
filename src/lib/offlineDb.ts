import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LossReason, Stage } from "@/lib/database.types";

export interface QueuedStageChange {
  kind: "stage_change";
  id: string;
  prospectId: string;
  newStage: Stage;
  note: string | null;
  lossReason: LossReason | null;
  createdAt: string;
}

export interface QueuedActivity {
  kind: "note" | "quick_log";
  id: string;
  prospectId: string;
  note: string;
  createdAt: string;
}

export type QueuedItem = QueuedStageChange | QueuedActivity;

interface OfflineDBSchema extends DBSchema {
  queue: {
    key: string;
    value: QueuedItem;
    indexes: { prospectId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>("overtake-crm-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("queue", { keyPath: "id" });
        store.createIndex("prospectId", "prospectId");
      },
    });
  }
  return dbPromise;
}

export async function enqueue(item: QueuedItem): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put("queue", item);
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete("queue", id);
}

export async function getQueue(): Promise<QueuedItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll("queue");
}

export async function getQueueForProspect(prospectId: string): Promise<QueuedItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAllFromIndex("queue", "prospectId", prospectId);
}

export async function getQueueCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  return db.count("queue");
}
