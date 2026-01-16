'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'viem';
import { useMina } from '@/app/providers';
import type { DepositResult, DepositStatus, L1ConfirmationResult, BridgeCompleteSummary, L1MonitorController } from '@siphoyawe/mina-sdk';

/**
 * Deposit state for tracking auto-deposit flow
 */
export interface DepositState {
  /** Whether deposit is in progress */
  isDepositing: boolean;
  /** Current deposit status */
  status: DepositStatus | 'idle' | 'waiting_arrival' | 'l1_monitoring' | 'l1_confirmed';
  /** HyperEVM deposit transaction hash */
  hyperEvmTxHash: string | null;
  /** Approval transaction hash (if needed) */
  approvalTxHash: string | null;
  /** Amount being deposited */
  amount: string | null;
  /** Formatted amount for display */
  amountFormatted: string | null;
  /** Error if deposit failed */
  error: Error | null;
  /** Whether error is recoverable */
  isRecoverable: boolean;
  /** L1 confirmation result */
  l1Result: L1ConfirmationResult | null;
  /** Final trading account balance */
  finalTradingBalance: string | null;
  /** Complete bridge summary */
  bridgeSummary: BridgeCompleteSummary | null;
}

/**
 * Options for auto-deposit execution
 */
export interface AutoDepositOptions {
  /** Amount that was bridged (in smallest units) */
  bridgedAmount: string;
  /** Source token symbol */
  fromTokenSymbol: string;
  /** Expected USDC amount on HyperEVM */
  expectedAmount?: string;
  /** Callback when deposit starts */
  onDepositStarted?: () => void;
  /** Callback when deposit completes */
  onDepositCompleted?: (result: DepositResult) => void;
  /** Callback when L1 confirms */
  onL1Confirmed?: (result: L1ConfirmationResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling auto-deposit flow after bridge completion
 *
 * @example
 * ```tsx
 * const { executeDeposit, retryDeposit, state, reset } = useAutoDeposit();
 *
 * // After bridge completes
 * await executeDeposit({
 *   bridgedAmount: '1000000000',
 *   fromTokenSymbol: 'USDC',
 *   onDepositCompleted: (result) => console.log('Deposited:', result),
 * });
 * ```
 */
export function useAutoDeposit() {
  const { mina, isReady } = useMina();
  const { data: walletClient } = useWalletClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const l1ControllerRef = useRef<L1MonitorController | null>(null);
  const isMountedRef = useRef(true);

  const [state, setState] = useState<DepositState>({
    isDepositing: false,
    status: 'idle',
    hyperEvmTxHash: null,
    approvalTxHash: null,
    amount: null,
    amountFormatted: null,
    error: null,
    isRecoverable: false,
    l1Result: null,
    finalTradingBalance: null,
    bridgeSummary: null,
  });

  // Safe setState that checks if component is still mounted
  const safeSetState = useCallback((update: React.SetStateAction<DepositState>) => {
    if (isMountedRef.current) {
      setState(update);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (l1ControllerRef.current) {
        l1ControllerRef.current.cancel();
      }
    };
  }, []);

  /**
   * Create a signer from wagmi wallet client
   */
  const createSigner = useCallback((client: WalletClient) => {
    return {
      getAddress: async () => {
        const [address] = await client.getAddresses();
        if (!address) throw new Error('No address available');
        return address;
      },
      getChainId: async () => client.chain?.id ?? 999,
      sendTransaction: async (tx: {
        to: string;
        data: string;
        value?: string;
        gasLimit?: string;
        chainId?: number;
      }) => {
        // Switch to HyperEVM if needed
        if (tx.chainId && tx.chainId !== client.chain?.id && client.switchChain) {
          try {
            await client.switchChain({ id: tx.chainId });
          } catch {
            if (client.chain?.id !== tx.chainId) {
              throw new Error('Please switch to HyperEVM (Chain 999) to continue');
            }
          }
        }

        if (!client.account) {
          throw new Error('Wallet account not available. Please reconnect your wallet.');
        }

        const hash = await client.sendTransaction({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: tx.value ? BigInt(tx.value) : undefined,
          gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
          chain: client.chain,
          account: client.account,
        });

        return hash;
      },
    };
  }, []);

  /**
   * Execute auto-deposit flow
   */
  const executeDeposit = useCallback(async (options: AutoDepositOptions): Promise<{
    success: boolean;
    depositResult?: DepositResult;
    l1Result?: L1ConfirmationResult;
    error?: Error;
  }> => {
    if (!mina || !isReady) {
      const error = new Error('SDK not initialized');
      safeSetState(prev => ({ ...prev, error, isRecoverable: false }));
      return { success: false, error };
    }

    if (!walletClient) {
      const error = new Error('Wallet not connected');
      safeSetState(prev => ({ ...prev, error, isRecoverable: false }));
      return { success: false, error };
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    safeSetState({
      isDepositing: true,
      status: 'waiting_arrival',
      hyperEvmTxHash: null,
      approvalTxHash: null,
      amount: options.bridgedAmount,
      amountFormatted: null,
      error: null,
      isRecoverable: false,
      l1Result: null,
      finalTradingBalance: null,
      bridgeSummary: null,
    });

    try {
      const signer = createSigner(walletClient);
      const walletAddress = await signer.getAddress();

      // Step 1: Detect USDC arrival on HyperEVM
      console.log('[AutoDeposit] Detecting USDC arrival on HyperEVM...');
      safeSetState(prev => ({ ...prev, status: 'waiting_arrival' }));

      const arrivalResult = await mina.detectUsdcArrival(walletAddress, {
        timeout: 300000, // 5 minutes
        expectedAmount: options.expectedAmount,
        onPoll: (attempt, balance) => {
          console.log(`[AutoDeposit] Poll ${attempt}: Balance = ${balance}`);
        },
      });

      if (!arrivalResult.detected) {
        throw new Error('USDC did not arrive on HyperEVM within timeout');
      }

      console.log('[AutoDeposit] USDC arrived:', arrivalResult.amountFormatted);
      options.onDepositStarted?.();

      // Step 2: Execute deposit to Hyperliquid L1
      safeSetState(prev => ({ ...prev, status: 'checking_balance' }));

      // Import deposit function from SDK
      const { executeDeposit: sdkExecuteDeposit } = await import('@siphoyawe/mina-sdk');

      const depositResult = await sdkExecuteDeposit(signer, {
        amount: arrivalResult.amount,
        walletAddress,
        destinationDex: 0, // PERPS (trading account)
        onStatusChange: (status) => {
          console.log('[AutoDeposit] Status:', status);
          safeSetState(prev => ({ ...prev, status }));
        },
        onDepositSubmitted: (txHash) => {
          console.log('[AutoDeposit] Deposit submitted:', txHash);
          safeSetState(prev => ({ ...prev, hyperEvmTxHash: txHash }));
        },
        onApprovalSubmitted: (txHash) => {
          console.log('[AutoDeposit] Approval submitted:', txHash);
          safeSetState(prev => ({ ...prev, approvalTxHash: txHash }));
        },
        infiniteApproval: true,
      });

      if (!depositResult.success) {
        throw new Error('Deposit transaction failed');
      }

      console.log('[AutoDeposit] Deposit confirmed on HyperEVM:', depositResult.depositTxHash);

      safeSetState(prev => ({
        ...prev,
        status: 'l1_monitoring',
        hyperEvmTxHash: depositResult.depositTxHash,
        amountFormatted: depositResult.amountFormatted,
      }));

      options.onDepositCompleted?.(depositResult);

      // Step 3: Monitor L1 confirmation
      const { monitorL1Confirmation } = await import('@siphoyawe/mina-sdk');

      const { result: l1ResultPromise, controller } = monitorL1Confirmation(
        walletAddress,
        depositResult.amount,
        depositResult.depositTxHash,
        {
          timeout: 180000, // 3 minutes
          onProgress: (progress) => {
            console.log(`[AutoDeposit] L1 monitoring: attempt ${progress.attempt}, elapsed ${progress.elapsed}ms`);
          },
          onTimeoutWarning: (warning) => {
            console.warn('[AutoDeposit] L1 timeout warning:', warning);
          },
        }
      );
      // Store controller for cleanup on unmount
      l1ControllerRef.current = controller;
      const l1Result = await l1ResultPromise;
      l1ControllerRef.current = null; // Clear after completion

      console.log('[AutoDeposit] L1 confirmed:', l1Result);

      safeSetState(prev => ({
        ...prev,
        status: 'l1_confirmed',
        isDepositing: false,
        l1Result,
        finalTradingBalance: l1Result.finalBalance,
      }));

      options.onL1Confirmed?.(l1Result);

      return { success: true, depositResult, l1Result };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[AutoDeposit] Error:', err);

      // Determine if error is recoverable
      const isRecoverable =
        err.message.includes('timeout') ||
        err.message.includes('network') ||
        err.message.includes('rejected') ||
        err.message.includes('gas');

      safeSetState(prev => ({
        ...prev,
        isDepositing: false,
        status: 'failed',
        error: err,
        isRecoverable,
      }));

      options.onError?.(err);

      return { success: false, error: err };
    }
  }, [mina, isReady, walletClient, createSigner]);

  /**
   * Retry failed deposit
   */
  const retryDeposit = useCallback(async (options: AutoDepositOptions) => {
    console.log('[AutoDeposit] Retrying deposit...');
    return executeDeposit(options);
  }, [executeDeposit]);

  /**
   * Reset deposit state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    safeSetState({
      isDepositing: false,
      status: 'idle',
      hyperEvmTxHash: null,
      approvalTxHash: null,
      amount: null,
      amountFormatted: null,
      error: null,
      isRecoverable: false,
      l1Result: null,
      finalTradingBalance: null,
      bridgeSummary: null,
    });
  }, []);

  return {
    executeDeposit,
    retryDeposit,
    reset,
    state,
    isDepositing: state.isDepositing,
    depositStatus: state.status,
    hyperEvmTxHash: state.hyperEvmTxHash,
    error: state.error,
    isRecoverable: state.isRecoverable,
    finalTradingBalance: state.finalTradingBalance,
    l1Result: state.l1Result,
  };
}

export default useAutoDeposit;
