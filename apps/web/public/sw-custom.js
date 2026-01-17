/**
 * Custom Service Worker for Mina Bridge
 *
 * Handles Background Sync for pending bridges queued while offline.
 * Handles Push Notifications for bridge status updates.
 * This file will be imported by the generated next-pwa service worker.
 *
 * Story 11.4 & 11.6 Implementation
 */

// IndexedDB Configuration (must match pending-bridges.ts)
const DB_NAME = 'mina-bridge-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-bridges';
const SYNC_TAG = 'pending-bridge';

/**
 * Open IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[SW] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('walletAddress', 'walletAddress', { unique: false });
      }
    };
  });
}

/**
 * Get all pending bridges from IndexedDB
 */
async function getPendingBridges() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('[SW] Failed to get bridges:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a pending bridge from IndexedDB
 */
async function deletePendingBridge(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('[SW] Failed to delete bridge:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[SW] Bridge deleted:', id);
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Show a notification to the user
 */
async function showNotification(title, body, data = {}) {
  if (self.registration.showNotification) {
    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'mina-bridge-notification',
      data,
      actions: [
        { action: 'view', title: 'View Bridge' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }
}

/**
 * Execute pending bridges when back online
 *
 * For the hackathon demo, this simplified implementation:
 * 1. Gets all pending bridges from IndexedDB
 * 2. Sends a notification that bridges are ready to execute
 * 3. Clears the pending bridges from the queue
 *
 * In a production implementation, this would actually execute
 * the bridges via the SDK, but that requires wallet signatures
 * which can only happen in the main thread.
 */
async function executePendingBridges() {
  console.log('[SW] Executing pending bridges...');

  try {
    const bridges = await getPendingBridges();

    if (bridges.length === 0) {
      console.log('[SW] No pending bridges to execute');
      return;
    }

    console.log(`[SW] Found ${bridges.length} pending bridge(s)`);

    // For each pending bridge, notify the user and clear from queue
    for (const bridge of bridges) {
      // Format the amount for display
      const formattedAmount = bridge.amount
        ? parseFloat(bridge.amount).toFixed(4)
        : 'Unknown';

      // Show notification that bridge is ready
      await showNotification(
        'Bridge Ready to Execute',
        `${formattedAmount} ${bridge.sourceTokenSymbol || 'tokens'} from ${bridge.sourceChainName || 'source'} is ready to bridge. Open Mina to complete.`,
        { bridgeId: bridge.id }
      );

      // Delete from pending queue
      // In production, you would wait for actual execution
      await deletePendingBridge(bridge.id);
    }

    // Post message to all clients about sync completion
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({
        type: 'PENDING_BRIDGES_SYNCED',
        count: bridges.length,
      });
    }

    console.log('[SW] All pending bridges processed');
  } catch (error) {
    console.error('[SW] Error executing pending bridges:', error);
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Handle Background Sync events
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event received:', event.tag);

  if (event.tag === SYNC_TAG) {
    event.waitUntil(executePendingBridges());
  }
});

/**
 * Handle push notification events
 *
 * Receives push messages and displays notifications for bridge status updates.
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
    data = { title: 'Mina Bridge', body: event.data?.text() || 'New notification' };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.svg',
    badge: data.badge || '/badge-72.svg',
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      type: data.type || 'generic',
      txHash: data.txHash || null,
      timestamp: Date.now(),
    },
    tag: data.tag || 'mina-bridge-notification',
    renotify: data.renotify !== false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Mina Bridge', options)
  );
});

/**
 * Handle notification clicks
 *
 * Routes to appropriate pages based on action and notification type.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  const notificationType = notificationData.type || 'generic';

  // Determine target URL based on action and notification type
  let targetUrl = notificationData.url || '/';

  if (action === 'view-details') {
    // Navigate to history/details page
    targetUrl = notificationData.txHash
      ? `/history?tx=${notificationData.txHash}`
      : '/history';
  } else if (action === 'start-trading') {
    // Navigate to trading page (Hyperliquid)
    targetUrl = 'https://app.hyperliquid.xyz/trade';
  } else if (action === 'retry') {
    // Navigate back to bridge page to retry
    targetUrl = '/';
  } else if (action === 'view') {
    // Legacy action from background sync notifications
    targetUrl = '/';
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click (no action) - use notification URL or home
    if (notificationType === 'success') {
      targetUrl = '/history';
    } else if (notificationType === 'failure') {
      targetUrl = '/';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window and navigate it
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return client.focus().then(() => {
            // Only navigate if it's an internal URL
            if (targetUrl.startsWith('/')) {
              return client.navigate(targetUrl);
            } else {
              // External URL - open in new window
              return self.clients.openWindow(targetUrl);
            }
          });
        }
      }

      // No existing window - open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', async (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'EXECUTE_PENDING_BRIDGES') {
    try {
      await executePendingBridges();
      event.ports[0]?.postMessage({ success: true });
    } catch (error) {
      event.ports[0]?.postMessage({ success: false, error: error.message });
    }
  }

  if (event.data.type === 'GET_PENDING_BRIDGES_COUNT') {
    try {
      const bridges = await getPendingBridges();
      event.ports[0]?.postMessage({ count: bridges.length });
    } catch (error) {
      event.ports[0]?.postMessage({ count: 0, error: error.message });
    }
  }
});

// Log that custom SW is loaded
console.log('[SW] Mina Bridge custom service worker loaded');
