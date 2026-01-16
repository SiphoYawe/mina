'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMina } from '@/app/providers';
import type { Quote, BalanceValidation, BalanceWarning } from '@siphoyawe/mina-sdk';

const STALE_TIME = 10_000; // 10 seconds

interface UseBalanceValidationOptions {
  /** Quote to validate against */
  quote: Quote | null;
  /** Whether validation is enabled */
  enabled?: boolean;
}

interface UseBalanceValidationReturn {
  /** Validation result */
  validation: BalanceValidation | null;
  /** Whether validation is loading */
  isLoading: boolean;
  /** Whether validation is currently fetching */
  isFetching: boolean;
  /** List of balance warnings */
  warnings: BalanceWarning[];
  /** Whether the balance is valid for the transaction */
  isValid: boolean;
  /** Whether token balance is sufficient */
  hasEnoughTokens: boolean;
  /** Whether gas balance is sufficient */
  hasEnoughGas: boolean;
  /** Error if validation failed */
  error: Error | null;
  /** Manually refetch validation */
  refetch: () => void;
}

/**
 * Hook for validating user balance against a quote
 *
 * Features:
 * - Uses TanStack Query with 10s staleTime
 * - Auto-validates when quote changes
 * - Provides granular validation status
 * - Returns detailed warnings for UI display
 */
export function useBalanceValidation({
  quote,
  enabled = true,
}: UseBalanceValidationOptions): UseBalanceValidationReturn {
  const { mina, isReady } = useMina();
  const { address, isConnected } = useAppKitAccount();

  // Determine if we can validate
  const canValidate = Boolean(
    isReady && mina && isConnected && address && quote && enabled
  );

  // Build query key
  const queryKey = ['balance-validation', quote?.id, address];

  const {
    data: validation,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<BalanceValidation | null, Error>({
    queryKey,
    queryFn: async (): Promise<BalanceValidation | null> => {
      if (!mina || !quote || !address) {
        return null;
      }

      const result = await mina.validateBalance(quote, address);
      return result;
    },
    enabled: canValidate,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Extract warnings and validation status
  const warnings = validation?.warnings ?? [];
  const isValid = validation?.valid ?? false;
  const hasEnoughTokens = validation?.tokenSufficient ?? true;
  const hasEnoughGas = validation?.gasSufficient ?? true;

  return {
    validation: validation ?? null,
    isLoading: isLoading && canValidate,
    isFetching,
    warnings,
    isValid,
    hasEnoughTokens,
    hasEnoughGas,
    error: error ?? null,
    refetch,
  };
}

export default useBalanceValidation;
