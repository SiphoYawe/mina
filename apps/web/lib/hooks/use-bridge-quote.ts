'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMina } from '@/app/providers';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import type { Quote, QuoteParams } from '@siphoyawe/mina-sdk';

const HYPEREVM_CHAIN_ID = 999;
const DEBOUNCE_DELAY = 500;
const STALE_TIME = 30_000; // 30 seconds
const REFETCH_INTERVAL = 15_000; // 15 seconds

interface UseBridgeQuoteOptions {
  /** Whether to enable auto-deposit to Hyperliquid (default: true) */
  autoDeposit?: boolean;
  /** Custom slippage tolerance (default: SDK default 0.5%) */
  slippage?: number;
}

interface UseBridgeQuoteReturn {
  /** The fetched quote */
  quote: Quote | null;
  /** Whether a quote is being fetched */
  isLoading: boolean;
  /** Whether the initial fetch is loading (no cached data) */
  isFetching: boolean;
  /** Error if quote fetch failed */
  error: Error | null;
  /** Manually refetch the quote */
  refetch: () => void;
  /** The debounced amount being used for quote */
  debouncedAmount: string;
  /** Whether quote params are valid for fetching */
  canFetchQuote: boolean;
}

/**
 * Hook for fetching bridge quotes with debounced amount input
 *
 * Features:
 * - 500ms debounce on amount changes
 * - TanStack Query with 30s staleTime and 15s refetch interval
 * - Auto-refetches when params change (chain, token, amount)
 * - Integrates with Zustand bridge store
 */
export function useBridgeQuote(options: UseBridgeQuoteOptions = {}): UseBridgeQuoteReturn {
  const { autoDeposit = true, slippage } = options;
  const { mina, isReady } = useMina();
  const { address, isConnected } = useAppKitAccount();

  // Get bridge params from store with shallow comparison for performance
  const { sourceChain, sourceToken, amount } = useBridgeStore(
    useShallow((state) => ({
      sourceChain: state.sourceChain,
      sourceToken: state.sourceToken,
      amount: state.amount,
    }))
  );

  // Debounced amount state
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce amount changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedAmount(amount);
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or amount change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [amount]);

  // Determine if we have valid params for a quote
  const canFetchQuote = Boolean(
    isReady &&
    mina &&
    isConnected &&
    address &&
    sourceChain?.id &&
    sourceToken?.address &&
    debouncedAmount &&
    parseFloat(debouncedAmount) > 0
  );

  // Build query key for caching
  const queryKey = [
    'bridge-quote',
    sourceChain?.id,
    sourceToken?.address,
    debouncedAmount,
    address,
    autoDeposit,
    slippage,
  ];

  // Parse amount to smallest unit (wei)
  const parseAmount = useCallback((amt: string, decimals: number): string => {
    try {
      const [whole, fraction = ''] = amt.split('.');
      const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
      const combined = whole + paddedFraction;
      // Remove leading zeros but keep at least one digit
      return combined.replace(/^0+/, '') || '0';
    } catch {
      return '0';
    }
  }, []);

  // Fetch quote using TanStack Query
  const {
    data: quote,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Quote | null, Error>({
    queryKey,
    queryFn: async (): Promise<Quote | null> => {
      if (!mina || !sourceChain || !sourceToken || !address || !debouncedAmount) {
        return null;
      }

      // Parse amount to smallest unit
      const fromAmountWei = parseAmount(debouncedAmount, sourceToken.decimals);

      if (fromAmountWei === '0') {
        return null;
      }

      // For now, use USDC on HyperEVM as destination token
      // This should be configurable in the future
      const USDC_HYPEREVM = '0xeb62eee3685fc4c43992febcd9e75443a2dc32ff';

      const params: QuoteParams = {
        fromChainId: sourceChain.id,
        toChainId: HYPEREVM_CHAIN_ID,
        fromToken: sourceToken.address,
        toToken: USDC_HYPEREVM,
        fromAmount: fromAmountWei,
        fromAddress: address,
        ...(slippage !== undefined && { slippage }),
      };

      const fetchedQuote = await mina.getQuote(params);

      return fetchedQuote;
    },
    enabled: canFetchQuote,
    staleTime: STALE_TIME,
    refetchInterval: canFetchQuote ? REFETCH_INTERVAL : false,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    quote: quote ?? null,
    isLoading: isLoading && canFetchQuote,
    isFetching,
    error: error ?? null,
    refetch,
    debouncedAmount,
    canFetchQuote,
  };
}

export default useBridgeQuote;
