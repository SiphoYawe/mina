'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMina } from '@/app/providers';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import type { Chain } from '@siphoyawe/mina-sdk';

// Query configuration
const CHAINS_STALE_TIME = 5 * 60 * 1000; // 5 minutes - chains don't change often
const CHAINS_GC_TIME = 10 * 60 * 1000; // 10 minutes garbage collection
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attemptIndex: number): number {
  // Exponential backoff: 1s, 2s, 4s (capped at 10s)
  return Math.min(RETRY_DELAY_BASE * 2 ** attemptIndex, 10000);
}

/**
 * Hook for fetching and managing chain data
 *
 * Features:
 * - Fetches chains from SDK using TanStack Query
 * - Automatic retry with exponential backoff (3 retries)
 * - Pre-selects wallet's current chain
 * - Detects when network switch is needed
 * - Proper caching and stale time management
 * - Manual refresh capability
 */
export function useChains() {
  // Issue 2 fix: Use ref to track if initial selection was done
  const hasInitialSelectionRef = useRef(false);

  const { mina, isReady: isMinaReady } = useMina();
  const { isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const queryClient = useQueryClient();

  // Get actions from store without subscribing to state changes
  const setSourceChain = useBridgeStore((state) => state.setSourceChain);
  const setNeedsNetworkSwitch = useBridgeStore((state) => state.setNeedsNetworkSwitch);
  const setIsLoadingChains = useBridgeStore((state) => state.setIsLoadingChains);
  const setChainsError = useBridgeStore((state) => state.setChainsError);
  // Issue 6: Get rehydrateSourceChain action for restoring chain from persisted ID
  const rehydrateSourceChain = useBridgeStore((state) => state.rehydrateSourceChain);

  // Get sourceChain separately for reading
  const sourceChain = useBridgeStore((state) => state.sourceChain);

  // Stable references for callbacks to avoid dependency issues
  const stableRefs = useRef({
    isConnected,
    walletChainId,
    setSourceChain,
    setNeedsNetworkSwitch,
    rehydrateSourceChain,
  });
  useEffect(() => {
    stableRefs.current = {
      isConnected,
      walletChainId,
      setSourceChain,
      setNeedsNetworkSwitch,
      rehydrateSourceChain,
    };
  }, [isConnected, walletChainId, setSourceChain, setNeedsNetworkSwitch, rehydrateSourceChain]);

  // TanStack Query for chains with retry logic
  const {
    data: chains = [],
    isLoading,
    isFetching,
    error,
    refetch,
    failureCount,
    isRefetching,
  } = useQuery<Chain[], Error>({
    queryKey: ['chains'],
    queryFn: async (): Promise<Chain[]> => {
      if (!mina) {
        throw new Error('SDK not initialized');
      }

      console.log('[useChains] Fetching chains...');
      const chainList = await mina.getChains();
      console.log('[useChains] Fetched', chainList.length, 'chains');
      return chainList;
    },
    enabled: isMinaReady && Boolean(mina),
    staleTime: CHAINS_STALE_TIME,
    gcTime: CHAINS_GC_TIME,
    retry: MAX_RETRIES,
    retryDelay: getRetryDelay,
    refetchOnWindowFocus: false, // Chains don't change often
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Handle chain selection and rehydration when chains are loaded
  useEffect(() => {
    if (!chains || chains.length === 0) return;

    const { isConnected: connected, walletChainId: chainId, setSourceChain: setChain, setNeedsNetworkSwitch: setSwitch, rehydrateSourceChain: rehydrate } = stableRefs.current;

    // Issue 6: Rehydrate sourceChain from persisted chain ID first
    rehydrate(chains);

    // If no chain is selected AND we haven't done initial selection, pre-select based on wallet connection
    const currentSourceChain = useBridgeStore.getState().sourceChain;
    if (!currentSourceChain && !hasInitialSelectionRef.current) {
      hasInitialSelectionRef.current = true;

      // Try to find wallet's current chain
      if (connected && chainId) {
        const walletChain = chains.find((chain: Chain) => chain.id === chainId);
        if (walletChain) {
          setChain(walletChain);
        } else {
          // Wallet chain not supported, select Ethereum as default
          const ethereum = chains.find((chain: Chain) => chain.id === 1);
          if (ethereum) {
            setChain(ethereum);
            setSwitch(true);
          }
        }
      } else {
        // No wallet connected, select Ethereum as default
        const ethereum = chains.find((chain: Chain) => chain.id === 1);
        if (ethereum) {
          setChain(ethereum);
        }
      }
    }
  }, [chains]);

  // Sync loading state to store
  useEffect(() => {
    setIsLoadingChains(isLoading);
  }, [isLoading, setIsLoadingChains]);

  // Sync error state to store
  useEffect(() => {
    const errorMessage = error ? (error instanceof Error ? error.message : 'Failed to fetch chains') : null;
    setChainsError(errorMessage);
    if (error) {
      console.error('[useChains] Error fetching chains:', error, `(attempt ${failureCount}/${MAX_RETRIES + 1})`);
    }
  }, [error, failureCount, setChainsError]);

  // Detect network switch needed when wallet chain changes
  useEffect(() => {
    if (isConnected && walletChainId && sourceChain) {
      const needsSwitch = walletChainId !== sourceChain.id;
      setNeedsNetworkSwitch(needsSwitch);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [isConnected, walletChainId, sourceChain, setNeedsNetworkSwitch]);

  // Track previous wallet chain to detect actual wallet network switches
  const prevWalletChainIdRef = useRef<number | undefined>(undefined);

  // Handle wallet chain change - only update source chain if wallet ACTUALLY switches networks
  // This should NOT override user's manual selection from the dropdown
  useEffect(() => {
    if (isConnected && walletChainId && chains.length > 0) {
      const prevChainId = prevWalletChainIdRef.current;
      prevWalletChainIdRef.current = walletChainId;

      // Only sync if wallet chain actually changed (not on initial mount or user dropdown selection)
      if (prevChainId !== undefined && prevChainId !== walletChainId) {
        const walletChain = chains.find((chain) => chain.id === walletChainId);
        if (walletChain) {
          // Wallet switched to a supported chain, update selection
          console.log('[useChains] Wallet switched networks, updating source chain to', walletChain.name);
          setSourceChain(walletChain);
        }
      }
    }
  }, [walletChainId, isConnected, chains, setSourceChain]);

  // Refresh chains - invalidates cache and refetches
  const refreshChains = useCallback(() => {
    console.log('[useChains] Manually refreshing chains');
    queryClient.invalidateQueries({ queryKey: ['chains'] });
    refetch();
  }, [queryClient, refetch]);

  return {
    chains,
    isLoading,
    isFetching,
    isRefetching,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch chains') : null,
    refreshChains,
    selectedChain: sourceChain,
    walletChainId,
    isConnected,
    /** Number of failed retry attempts (0-3) */
    failureCount,
    /** Maximum retry attempts */
    maxRetries: MAX_RETRIES,
  };
}

/**
 * Hook for detecting if network switch is needed
 * Returns true if wallet is connected to a different chain than selected
 */
export function useNetworkSwitchNeeded() {
  const { isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const sourceChain = useBridgeStore((state) => state.sourceChain);

  if (!isConnected || !walletChainId || !sourceChain) {
    return { needsSwitch: false, walletChainId: null, targetChainId: null };
  }

  return {
    needsSwitch: walletChainId !== sourceChain.id,
    walletChainId,
    targetChainId: sourceChain.id,
  };
}
