'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMina } from '@/app/providers';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import type { Chain } from '@siphoyawe/mina-sdk';

/**
 * Hook for fetching and managing chain data
 *
 * Features:
 * - Fetches chains from SDK
 * - Pre-selects wallet's current chain
 * - Detects when network switch is needed
 * - Manages loading and error states
 */
export function useChains() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue 2 fix: Use ref to track if initial selection was done
  const hasInitialSelectionRef = useRef(false);

  const { mina, isReady: isMinaReady } = useMina();
  const { isConnected } = useAppKitAccount();
  const walletChainId = useChainId();

  // Get actions from store without subscribing to state changes
  const setSourceChain = useBridgeStore((state) => state.setSourceChain);
  const setNeedsNetworkSwitch = useBridgeStore((state) => state.setNeedsNetworkSwitch);
  const setIsLoadingChains = useBridgeStore((state) => state.setIsLoadingChains);
  const setChainsError = useBridgeStore((state) => state.setChainsError);
  // Issue 6: Get rehydrateSourceChain action for restoring chain from persisted ID
  const rehydrateSourceChain = useBridgeStore((state) => state.rehydrateSourceChain);

  // Get sourceChain separately for reading (not in deps of fetchChains)
  const sourceChain = useBridgeStore((state) => state.sourceChain);

  // Fetch chains from SDK
  // Issue 2 fix: Remove sourceChain from deps to prevent infinite loop
  const fetchChains = useCallback(async () => {
    if (!mina || !isMinaReady) return;

    setIsLoading(true);
    setIsLoadingChains(true);
    setError(null);
    setChainsError(null);

    try {
      // mina.getChains() returns Chain[] directly
      // mina.getChainsWithMetadata() returns { chains, isStale, cachedAt }
      const chainList = await mina.getChains();
      setChains(chainList);

      // Issue 6: Rehydrate sourceChain from persisted chain ID first
      rehydrateSourceChain(chainList);

      // If no chain is selected AND we haven't done initial selection, pre-select based on wallet connection
      // Use ref to prevent re-triggering on subsequent fetches
      const currentSourceChain = useBridgeStore.getState().sourceChain;
      if (!currentSourceChain && !hasInitialSelectionRef.current && chainList.length > 0) {
        hasInitialSelectionRef.current = true;

        // Try to find wallet's current chain
        if (isConnected && walletChainId) {
          const walletChain = chainList.find(
            (chain: Chain) => chain.id === walletChainId
          );
          if (walletChain) {
            setSourceChain(walletChain);
          } else {
            // Wallet chain not supported, select Ethereum as default
            const ethereum = chainList.find((chain: Chain) => chain.id === 1);
            if (ethereum) {
              setSourceChain(ethereum);
              setNeedsNetworkSwitch(true);
            }
          }
        } else {
          // No wallet connected, select Ethereum as default
          const ethereum = chainList.find((chain: Chain) => chain.id === 1);
          if (ethereum) {
            setSourceChain(ethereum);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chains';
      setError(message);
      setChainsError(message);
      console.error('[useChains] Error fetching chains:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingChains(false);
    }
  }, [
    mina,
    isMinaReady,
    // Issue 2 fix: Removed sourceChain from deps
    isConnected,
    walletChainId,
    setSourceChain,
    setNeedsNetworkSwitch,
    setIsLoadingChains,
    setChainsError,
    rehydrateSourceChain,
  ]);

  // Fetch chains when SDK is ready
  useEffect(() => {
    if (isMinaReady && mina) {
      fetchChains();
    }
  }, [isMinaReady, mina, fetchChains]);

  // Detect network switch needed when wallet chain changes
  useEffect(() => {
    if (isConnected && walletChainId && sourceChain) {
      const needsSwitch = walletChainId !== sourceChain.id;
      setNeedsNetworkSwitch(needsSwitch);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [isConnected, walletChainId, sourceChain, setNeedsNetworkSwitch]);

  // Handle wallet chain change - update source chain if wallet switches
  useEffect(() => {
    if (isConnected && walletChainId && chains.length > 0) {
      const walletChain = chains.find((chain) => chain.id === walletChainId);
      if (walletChain && sourceChain?.id !== walletChainId) {
        // Wallet switched to a supported chain, update selection
        setSourceChain(walletChain);
      }
    }
  }, [walletChainId, isConnected, chains, sourceChain, setSourceChain]);

  // Refresh chains
  const refreshChains = useCallback(() => {
    fetchChains();
  }, [fetchChains]);

  return {
    chains,
    isLoading,
    error,
    refreshChains,
    selectedChain: sourceChain,
    walletChainId,
    isConnected,
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
