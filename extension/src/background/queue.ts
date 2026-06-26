import type { QueueItem, Submission } from '@/types/submission';
import { openDB, type IDBPDatabase } from 'idb';
import * as storage from '@/lib/storage';

const DB_NAME = 'leetcode-ai-sync';
const DB_VERSION = 1;
const STORE = 'queue';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

async function syncToStorage(items: QueueItem[]): Promise<void> {
  await storage.set('queue', items);
}

export async function addToQueue(item: QueueItem): Promise<void> {
  const db = await getDB();
  await db.put(STORE, item);
  const all = await getAllItems();
  await syncToStorage(all);
}

export async function getAllItems(): Promise<QueueItem[]> {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getPendingItems(): Promise<QueueItem[]> {
  const all = await getAllItems();
  return all.filter(
    item =>
      (item.status === 'pending' || item.status === 'failed') &&
      item.attempts < 5
  );
}

export async function updateQueueItem(
  id: string,
  updates: Partial<QueueItem>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE, id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  await db.put(STORE, updated);
  const all = await getAllItems();
  await syncToStorage(all);
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
  const all = await getAllItems();
  await syncToStorage(all);
}

export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
  await syncToStorage([]);
}
