'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMina } from '@/app/providers';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { HYPEREVM_USDC_ADDRESS } from '@siphoyawe/mina-sdk';
import type { Quote, QuoteParams } from '@siphoyawe/mina-sdk';

const HYPEREVM_CHAIN_ID = 999;
const DEBOUNCE_DELAY = 500;
const STALE_TIME = 30_000; // 30 seconds
const REFETCH_INTERVAL = 15_000; // 15 seconds

// Placeholder address for simulation mode
// Using a zero-padded address that's clearly a simulation placeholder
// This avoids using real addresses and makes API logs clearly identifiable
const SIMULATION_ADDRESS = '0x0000000000000000000000000000000000000001';

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
  const { autoDeposit: autoDepositOverride, slippage: slippageOverride } = options;
  const { mina, isReady } = useMina();
  const { address, isConnected } = useAppKitAccount();

  // Get bridge params from store with shallow comparison for performance
  const { mode, sourceChain, sourceToken, amount } = useBridgeStore(
    useShallow((state) => ({
      mode: state.mode,
      sourceChain: state.sourceChain,
      sourceToken: state.sourceToken,
      amount: state.amount,
    }))
  );

  // Determine if we're in simulation mode
  const isSimulateMode = mode === 'simulate';

  // Use wallet address in bridge mode, or placeholder in simulate mode
  const effectiveAddress = isSimulateMode ? SIMULATION_ADDRESS : address;

  // Get settings from settings store (including autoDeposit for SETTINGS-003 fix)
  const { slippage: settingsSlippage, routePreference, autoDeposit: settingsAutoDeposit } = useSettingsStore(
    useShallow((state) => ({
      slippage: state.slippage,
      routePreference: state.routePreference,
      autoDeposit: state.autoDeposit,
    }))
  );

  // Use override values if provided, otherwise use settings store values
  const slippage = slippageOverride ?? settingsSlippage;
  const autoDeposit = autoDepositOverride ?? settingsAutoDeposit;

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
  // In simulate mode, we don't need isConnected or a real address
  const canFetchQuote = Boolean(
    isReady &&
    mina &&
    (isSimulateMode || (isConnected && address)) &&
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
    effectiveAddress,
    autoDeposit,
    slippage,
    routePreference,
    isSimulateMode ? 'simulate' : 'bridge',
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
      if (!mina || !sourceChain || !sourceToken || !effectiveAddress || !debouncedAmount) {
        return null;
      }

      // Parse amount to smallest unit
      const fromAmountWei = parseAmount(debouncedAmount, sourceToken.decimals);

      if (fromAmountWei === '0') {
        return null;
      }

      // Use USDC on HyperEVM as destination token (QUOTE-004 fix: use SDK constant)
      // HYPEREVM_USDC_ADDRESS is the correct USDC address on HyperEVM
      const params: QuoteParams = {
        fromChainId: sourceChain.id,
        toChainId: HYPEREVM_CHAIN_ID,
        fromToken: sourceToken.address,
        toToken: HYPEREVM_USDC_ADDRESS,
        fromAmount: fromAmountWei,
        fromAddress: effectiveAddress,
        slippageTolerance: slippage,
        routePreference,
      };

      // SETTINGS-003 fix: Update SDK autoDeposit setting before fetching quote
      // This ensures the quote reflects the current auto-deposit preference
      mina.setAutoDeposit(autoDeposit);

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
