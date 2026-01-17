'use client';

import { useSyncExternalStore } from 'react';

/**
 * Get current online status from navigator
 * Safe to call on server (returns true - assume online)
 */
function getOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 */
function subscribeToOnlineStatus(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Server snapshot - always returns true to avoid hydration mismatch
 * (assume online on server)
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Hook to detect online/offline status
 *
 * Uses useSyncExternalStore to safely handle SSR hydration.
 * Listens to the browser's online/offline events and returns
 * the current connection status.
 *
 * @returns boolean indicating if the browser is online
 *
 * @example
 * ```tsx
 * function NetworkStatus() {
 *   const isOnline = useOnlineStatus();
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   return <OnlineContent />;
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerSnapshot
  );
}
