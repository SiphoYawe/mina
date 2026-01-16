'use client';

import { useCallback, useState } from 'react';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'viem';
import { useMina } from '@/app/providers';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import type { Quote, StepStatusPayload, TransactionStatusPayload, StepType } from '@siphoyawe/mina-sdk';

/**
 * Bridge execution result
 */
export interface ExecutionResult {
  success: boolean;
  executionId: string;
  txHash?: string;
  receivingTxHash?: string;
  receivedAmount?: string;
  error?: Error;
}

/**
 * Type for the wallet client from wagmi
 */
type WagmiWalletClient = WalletClient;

/**
 * Custom signer adapter for wagmi wallet client
 * Adapts wagmi's WalletClient to the Mina SDK's TransactionSigner interface
 */
function createWagmiSigner(walletClient: WagmiWalletClient) {
  return {
    getAddress: async () => {
      const [address] = await walletClient.getAddresses();
      if (!address) {
        throw new Error('No address available from wallet');
      }
      return address;
    },
    getChainId: async () => {
      return walletClient.chain?.id ?? 1;
    },
    sendTransaction: async (tx: {
      to: string;
      data: string;
      value?: string;
      gasLimit?: string;
      gasPrice?: string;
      chainId?: number;
    }) => {
      // Ensure we're on the right chain
      if (tx.chainId && walletClient.switchChain) {
        try {
          await walletClient.switchChain({ id: tx.chainId });
        } catch {
          // Verify we're on the correct chain after switch attempt
          const currentChainId = walletClient.chain?.id;
          if (currentChainId !== tx.chainId) {
            throw new Error(`Please switch to chain ${tx.chainId} to continue`);
          }
        }
      }

      const hash = await walletClient.sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
        gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
        chain: walletClient.chain,
        account: walletClient.account!,
      });

      return hash;
    },
  };
}

/**
 * Hook for executing bridge transactions with progress tracking
 *
 * @example
 * ```tsx
 * const { execute, isExecuting, progress, error } = useBridgeExecution();
 *
 * const handleBridge = async () => {
 *   const result = await execute(quote);
 *   if (result.success) {
 *     console.log('Bridge complete!', result.txHash);
 *   }
 * };
 * ```
 */
export function useBridgeExecution() {
  const { mina, isReady } = useMina();
  const { data: walletClient } = useWalletClient();
  const [isLocalExecuting, setIsLocalExecuting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    isExecuting,
    executionId,
    status,
    steps,
    progress,
    txHash,
    error,
    errorDetails,
    startExecution,
    updateStep,
    updateStatus,
    setCompleted,
    setFailed,
    reset,
    openModal,
    closeModal,
  } = useTransactionStore();

  /**
   * Execute a bridge transaction
   */
  const execute = useCallback(
    async (quote: Quote): Promise<ExecutionResult> => {
      if (!mina || !isReady) {
        return {
          success: false,
          executionId: '',
          error: new Error('SDK not initialized'),
        };
      }

      if (!walletClient) {
        return {
          success: false,
          executionId: '',
          error: new Error('Wallet not connected'),
        };
      }

      // Check if quote has expired
      if (quote.expiresAt && Date.now() > quote.expiresAt) {
        return {
          success: false,
          executionId: '',
          error: new Error('Quote has expired. Please get a new quote.'),
        };
      }

      setIsLocalExecuting(true);

      // Map quote steps to step info
      const stepInfo = quote.steps.map((step) => ({
        id: step.id,
        type: mapStepType(step.type),
      }));

      // Generate a simple execution ID
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Start execution in store
      startExecution({
        executionId,
        steps: stepInfo,
        fromChainId: quote.fromToken.chainId,
        toChainId: quote.toToken.chainId,
      });

      try {
        const signer = createWagmiSigner(walletClient as WagmiWalletClient);

        // Execute the bridge transaction
        const result = await mina.execute({
          quote,
          signer,
          onStepChange: (stepStatus: StepStatusPayload) => {
            updateStep(stepStatus);
          },
          onStatusChange: (status: TransactionStatusPayload) => {
            updateStatus(status);
          },
        });

        // Handle completion
        if (result.status === 'completed') {
          setCompleted({
            txHash: result.txHash,
            receivingTxHash: result.depositTxHash ?? undefined,
            receivedAmount: result.receivedAmount,
          });

          setIsLocalExecuting(false);

          return {
            success: true,
            executionId: result.executionId,
            txHash: result.txHash,
            receivingTxHash: result.depositTxHash ?? undefined,
            receivedAmount: result.receivedAmount,
          };
        } else if (result.status === 'failed') {
          const errorObj = result.error || new Error('Bridge transaction failed');
          setFailed({
            message: errorObj.message,
            code: (errorObj as any).code,
            recoverable: (errorObj as any).recoverable,
            recoveryAction: (errorObj as any).recoveryAction,
            userMessage: (errorObj as any).userMessage,
          });

          setIsLocalExecuting(false);

          return {
            success: false,
            executionId: result.executionId,
            error: errorObj,
          };
        }

        // Status is executing or pending - treat as in progress
        setIsLocalExecuting(false);

        return {
          success: false,
          executionId: result.executionId,
          error: new Error('Transaction still in progress'),
        };
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        setFailed({
          message: errorObj.message,
          code: (errorObj as any).code,
          recoverable: (errorObj as any).recoverable ?? false,
          recoveryAction: (errorObj as any).recoveryAction,
          userMessage: (errorObj as any).userMessage ?? errorObj.message,
        });

        setIsLocalExecuting(false);

        return {
          success: false,
          executionId,
          error: errorObj,
        };
      }
    },
    [mina, isReady, walletClient, startExecution, updateStep, updateStatus, setCompleted, setFailed]
  );

  /**
   * Retry a failed execution
   */
  const retry = useCallback(
    async (retryExecutionId?: string): Promise<ExecutionResult> => {
      const targetExecutionId = retryExecutionId || executionId;

      if (!targetExecutionId) {
        return {
          success: false,
          executionId: '',
          error: new Error('No execution to retry'),
        };
      }

      if (!mina || !isReady) {
        return {
          success: false,
          executionId: targetExecutionId,
          error: new Error('SDK not initialized'),
        };
      }

      if (!walletClient) {
        return {
          success: false,
          executionId: targetExecutionId,
          error: new Error('Wallet not connected'),
        };
      }

      setIsRetrying(true);

      try {
        const signer = createWagmiSigner(walletClient as WagmiWalletClient);

        const result = await mina.retry(targetExecutionId, {
          signer,
          onStepChange: updateStep,
          onStatusChange: updateStatus,
        });

        if (result.status === 'completed') {
          setCompleted({
            txHash: result.txHash,
            receivingTxHash: result.depositTxHash ?? undefined,
            receivedAmount: result.receivedAmount,
          });

          setIsRetrying(false);

          return {
            success: true,
            executionId: result.executionId,
            txHash: result.txHash,
          };
        } else if (result.status === 'failed') {
          const errorObj = result.error || new Error('Retry failed');
          setFailed({
            message: errorObj.message,
            code: (errorObj as any).code,
            recoverable: (errorObj as any).recoverable,
            recoveryAction: (errorObj as any).recoveryAction,
            userMessage: (errorObj as any).userMessage,
          });

          setIsRetrying(false);

          return {
            success: false,
            executionId: result.executionId,
            error: errorObj,
          };
        }

        // Status is executing or pending - treat as in progress
        setIsRetrying(false);

        return {
          success: false,
          executionId: result.executionId,
          error: new Error('Retry is in progress'),
        };
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        setFailed({
          message: errorObj.message,
          code: (errorObj as any).code,
          recoverable: (errorObj as any).recoverable ?? false,
          recoveryAction: (errorObj as any).recoveryAction,
          userMessage: (errorObj as any).userMessage ?? errorObj.message,
        });

        setIsRetrying(false);

        return {
          success: false,
          executionId: targetExecutionId,
          error: errorObj,
        };
      }
    },
    [mina, isReady, walletClient, executionId, updateStep, updateStatus, setCompleted, setFailed]
  );

  return {
    execute,
    retry,
    isExecuting: isExecuting || isLocalExecuting,
    isRetrying,
    executionId,
    status,
    steps,
    progress,
    txHash,
    error,
    errorDetails,
    reset,
    openModal,
    closeModal,
  };
}

/**
 * Map quote step type to StepType
 */
function mapStepType(type: string): StepType {
  switch (type.toLowerCase()) {
    case 'approve':
    case 'approval':
      return 'approval';
    case 'swap':
      return 'swap';
    case 'bridge':
    case 'cross':
    case 'lifi':
      return 'bridge';
    case 'deposit':
      return 'deposit';
    default:
      return 'bridge';
  }
}

export default useBridgeExecution;
