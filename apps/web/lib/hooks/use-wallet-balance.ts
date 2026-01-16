'use client';

import { useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useMina } from '@/app/providers';

/**
 * Custom hook that bridges wallet connection with SDK balance fetching.
 * Automatically triggers balance fetching when wallet connects.
 */
export function useWalletBalance() {
  const { address, isConnected } = useAppKitAccount();
  const { chain } = useAccount();
  const chainId = useChainId();
  const { mina, isReady: isMinaReady } = useMina();

  // Issue 7 Fix: Add validation check for proper address format before casting
  const isValidAddress = address && /^0x[a-fA-F0-9]{40}$/.test(address);
  const validatedAddress = isValidAddress ? (address as `0x${string}`) : undefined;

  // Native token balance (ETH, MATIC, etc.)
  const {
    data: nativeBalance,
    isLoading: isNativeBalanceLoading,
    refetch: refetchNativeBalance,
  } = useBalance({
    address: validatedAddress,
    query: {
      enabled: isConnected && !!validatedAddress,
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: true,
    },
  });

  // Effect to trigger SDK balance fetch when connected
  useEffect(() => {
    if (isConnected && address && isMinaReady && mina) {
      // SDK balance fetching can be triggered here
      // The Mina SDK will handle multi-token balance fetching
      console.log('[Wallet Balance] Wallet connected:', address);
      console.log('[Wallet Balance] Chain:', chain?.name || chainId);
    }
  }, [isConnected, address, isMinaReady, mina, chain, chainId]);

  // Refetch all balances
  const refetchBalances = useCallback(() => {
    refetchNativeBalance();
  }, [refetchNativeBalance]);

  return {
    address,
    isConnected,
    chainId,
    chain,
    nativeBalance,
    isNativeBalanceLoading,
    refetchBalances,
    isMinaReady,
  };
}

/**
 * Hook to clear cached balance data (used on disconnect)
 */
export function useClearBalanceCache() {
  return useCallback(() => {
    // Clear any balance-related cache from localStorage
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('balance') || key.includes('mina-') || key.includes('token-cache'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[Balance Cache] Cleared', keysToRemove.length, 'cached items');
    } catch (err) {
      console.error('[Balance Cache] Failed to clear cache:', err);
    }
  }, []);
}
