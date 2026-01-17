'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOnlineStatus } from './use-online-status';
import {
  getPendingBridges,
  getPendingBridgesForWallet,
  queueBridgeForOffline,
  deletePendingBridge,
  clearAllPendingBridges,
  isBackgroundSyncSupported,
  type PendingBridge,
} from '@/lib/storage/pending-bridges';

/**
 * Parameters for queueing a bridge
 */
export interface QueueBridgeParams {
  sourceChain: number;
  sourceChainName: string;
  sourceToken: string;
  sourceTokenSymbol: string;
  amount: string;
  destToken: string;
  destTokenSymbol: string;
  autoDeposit: boolean;
  walletAddress: string;
}

/**
 * Return type for usePendingBridge hook
 */
export interface UsePendingBridgeReturn {
  /** List of pending bridges */
  pendingBridges: PendingBridge[];
  /** Number of pending bridges */
  pendingCount: number;
  /** Whether there are any pending bridges */
  hasPending: boolean;
  /** Whether Background Sync is supported */
  syncSupported: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Queue a bridge for offline execution */
  queueBridge: (params: QueueBridgeParams) => Promise<PendingBridge | null>;
  /** Remove a pending bridge */
  removePendingBridge: (id: string) => Promise<void>;
  /** Clear all pending bridges */
  clearPending: () => Promise<void>;
  /** Refresh the pending bridges list */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing pending bridges that are queued for offline execution
 *
 * Provides functionality to:
 * - Queue bridges when offline
 * - Track pending bridges in IndexedDB
 * - Register Background Sync for execution when back online
 * - Sync state with service worker messages
 *
 * Story 11.4 Implementation
 *
 * @param walletAddress - Optional wallet address to filter bridges
 * @returns Object with pending bridges state and actions
 *
 * @example
 * ```tsx
 * function BridgeForm() {
 *   const { pendingBridges, hasPending, queueBridge } = usePendingBridge();
 *   const isOnline = useOnlineStatus();
 *
 *   const handleBridge = async () => {
 *     if (!isOnline) {
 *       await queueBridge({
 *         sourceChain: 1,
 *         sourceChainName: 'Ethereum',
 *         sourceToken: '0x...',
 *         sourceTokenSymbol: 'ETH',
 *         amount: '1.0',
 *         destToken: '0x...',
 *         destTokenSymbol: 'USDC',
 *         autoDeposit: true,
 *         walletAddress: '0x...',
 *       });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {hasPending && <QueuedBridgeBanner count={pendingBridges.length} />}
 *       <button onClick={handleBridge}>Bridge</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePendingBridge(walletAddress?: string): UsePendingBridgeReturn {
  const [pendingBridges, setPendingBridges] = useState<PendingBridge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();

  // Check if Background Sync is supported
  const syncSupported = useMemo(() => isBackgroundSyncSupported(), []);

  /**
   * Fetch pending bridges from IndexedDB
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const bridges = walletAddress
        ? await getPendingBridgesForWallet(walletAddress)
        : await getPendingBridges();
      setPendingBridges(bridges);
    } catch (error) {
      console.error('[usePendingBridge] Failed to fetch bridges:', error);
      setPendingBridges([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  /**
   * Queue a bridge for offline execution
   */
  const queueBridge = useCallback(
    async (params: QueueBridgeParams): Promise<PendingBridge | null> => {
      try {
        const bridge = await queueBridgeForOffline(params);
        await refresh();
        return bridge;
      } catch (error) {
        console.error('[usePendingBridge] Failed to queue bridge:', error);
        return null;
      }
    },
    [refresh]
  );

  /**
   * Remove a pending bridge
   */
  const removePendingBridge = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deletePendingBridge(id);
        await refresh();
      } catch (error) {
        console.error('[usePendingBridge] Failed to remove bridge:', error);
      }
    },
    [refresh]
  );

  /**
   * Clear all pending bridges
   */
  const clearPending = useCallback(async (): Promise<void> => {
    try {
      await clearAllPendingBridges();
      setPendingBridges([]);
    } catch (error) {
      console.error('[usePendingBridge] Failed to clear bridges:', error);
    }
  }, []);

  // Load pending bridges on mount and when wallet changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh when coming back online
  useEffect(() => {
    if (isOnline) {
      // Small delay to allow Background Sync to execute first
      const timeout = setTimeout(refresh, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, refresh]);

  // Listen for service worker messages about sync completion
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PENDING_BRIDGES_SYNCED') {
        console.log(
          '[usePendingBridge] Received sync completion:',
          event.data.count
        );
        refresh();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [refresh]);

  // Computed values
  const pendingCount = pendingBridges.length;
  const hasPending = pendingCount > 0;

  return {
    pendingBridges,
    pendingCount,
    hasPending,
    syncSupported,
    isLoading,
    queueBridge,
    removePendingBridge,
    clearPending,
    refresh,
  };
}

export default usePendingBridge;
