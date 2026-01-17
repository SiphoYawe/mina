'use client';

/**
 * Pending Bridge Configuration
 *
 * Represents a bridge that was queued while offline and will be
 * executed when the connection is restored via Background Sync.
 *
 * Story 11.4 Implementation
 */
export interface PendingBridge {
  /** Unique ID for the pending bridge */
  id: string;
  /** Source chain ID */
  sourceChain: number;
  /** Source chain name */
  sourceChainName: string;
  /** Source token address */
  sourceToken: string;
  /** Source token symbol */
  sourceTokenSymbol: string;
  /** Amount to bridge (as string for precision) */
  amount: string;
  /** Destination token address (on Hyperliquid) */
  destToken: string;
  /** Destination token symbol */
  destTokenSymbol: string;
  /** Whether to auto-deposit to Hyperliquid */
  autoDeposit: boolean;
  /** User's wallet address */
  walletAddress: string;
  /** Timestamp when the bridge was queued */
  createdAt: number;
}

/**
 * IndexedDB Configuration
 */
const DB_NAME = 'mina-bridge-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-bridges';
const SYNC_TAG = 'pending-bridge';

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'indexedDB' in window;
}

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

/**
 * Open the IndexedDB database
 * Creates the object store if it doesn't exist
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[PendingBridges] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for pending bridges
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('walletAddress', 'walletAddress', { unique: false });
        console.log('[PendingBridges] Object store created');
      }
    };
  });
}

/**
 * Generate a unique ID for pending bridges
 */
function generateId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a pending bridge to IndexedDB
 */
export async function savePendingBridge(
  bridge: Omit<PendingBridge, 'id' | 'createdAt'>
): Promise<PendingBridge> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pendingBridge: PendingBridge = {
      ...bridge,
      id: generateId(),
      createdAt: Date.now(),
    };

    const request = store.add(pendingBridge);

    request.onerror = () => {
      console.error('[PendingBridges] Failed to save bridge:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[PendingBridges] Bridge saved:', pendingBridge.id);
      resolve(pendingBridge);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get all pending bridges from IndexedDB
 */
export async function getPendingBridges(): Promise<PendingBridge[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('[PendingBridges] Failed to get bridges:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const bridges = request.result as PendingBridge[];
      // Sort by createdAt descending (newest first)
      bridges.sort((a, b) => b.createdAt - a.createdAt);
      resolve(bridges);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get pending bridges for a specific wallet address
 */
export async function getPendingBridgesForWallet(
  walletAddress: string
): Promise<PendingBridge[]> {
  const bridges = await getPendingBridges();
  return bridges.filter(
    (b) => b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}

/**
 * Get a single pending bridge by ID
 */
export async function getPendingBridge(id: string): Promise<PendingBridge | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      console.error('[PendingBridges] Failed to get bridge:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result as PendingBridge | null);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a pending bridge from IndexedDB
 */
export async function deletePendingBridge(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('[PendingBridges] Failed to delete bridge:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[PendingBridges] Bridge deleted:', id);
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clear all pending bridges from IndexedDB
 */
export async function clearAllPendingBridges(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      console.error('[PendingBridges] Failed to clear bridges:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[PendingBridges] All bridges cleared');
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Register a Background Sync for pending bridges
 * This will trigger the service worker to execute bridges when online
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    console.warn('[PendingBridges] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // TypeScript doesn't have full SyncManager types, so we cast
    const sync = (registration as ServiceWorkerRegistration & { sync: SyncManager }).sync;

    if (sync) {
      await sync.register(SYNC_TAG);
      console.log('[PendingBridges] Background Sync registered:', SYNC_TAG);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PendingBridges] Failed to register Background Sync:', error);
    return false;
  }
}

/**
 * Queue a bridge for offline execution
 * Saves to IndexedDB and registers Background Sync
 */
export async function queueBridgeForOffline(
  bridge: Omit<PendingBridge, 'id' | 'createdAt'>
): Promise<PendingBridge> {
  // Save to IndexedDB
  const savedBridge = await savePendingBridge(bridge);

  // Register Background Sync to execute when back online
  await registerBackgroundSync();

  return savedBridge;
}

/**
 * Get the Background Sync tag name
 * Exported for use in the service worker
 */
export function getSyncTag(): string {
  return SYNC_TAG;
}

/**
 * Get the store name for use in service worker
 */
export function getStoreName(): string {
  return STORE_NAME;
}

/**
 * Get the DB name for use in service worker
 */
export function getDBName(): string {
  return DB_NAME;
}

// Extend ServiceWorkerRegistration to include sync
declare global {
  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }

  interface ServiceWorkerRegistration {
    sync?: SyncManager;
  }
}
