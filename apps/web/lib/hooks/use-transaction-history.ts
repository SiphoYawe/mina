'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useMina } from '@/app/providers';
import { useTransactionStore, type UIStepStatus } from '@/lib/stores/transaction-store';
import {
  type StoredTransaction,
  type StoredTransactionStatus,
  getStoredTransactionsArray,
  saveTransaction,
  updateTransaction as updateStoredTransaction,
  removeTransaction as removeStoredTransaction,
  cleanupOldTransactions,
  getPendingTransactions,
  createStoredTransaction,
  type StoredToken,
} from '@/lib/storage/transactions';

/**
 * Hook for managing transaction history with localStorage persistence
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   addTransaction,
 *   resumePending,
 *   isRestoringPending,
 * } = useTransactionHistory();
 *
 * // Add a new transaction on execution start
 * addTransaction({
 *   executionId: 'exec_123',
 *   fromChainId: 1,
 *   toChainId: 999,
 *   ...
 * });
 *
 * // Resume pending transactions on page load
 * useEffect(() => {
 *   resumePending();
 * }, []);
 * ```
 */
export function useTransactionHistory() {
  const { mina, isReady } = useMina();
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoringPending, setIsRestoringPending] = useState(false);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const {
    updateStep,
    updateStatus,
    setCompleted,
    setFailed,
    openModal,
    startExecution,
  } = useTransactionStore();

  // Load transactions from storage on mount
  useEffect(() => {
    // Clean up old transactions first
    cleanupOldTransactions();

    // Load remaining transactions
    const stored = getStoredTransactionsArray();
    setTransactions(stored);
    setIsLoading(false);

    console.log(`[TransactionHistory] Loaded ${stored.length} transactions from storage`);
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  /**
   * Add a new transaction to history
   */
  const addTransaction = useCallback(
    (params: {
      executionId: string;
      fromChainId: number;
      fromChainName: string;
      toChainId: number;
      toChainName: string;
      fromToken: StoredToken;
      toToken: StoredToken;
      fromAmount: string;
      toAmount: string;
      steps: UIStepStatus[];
    }) => {
      const tx = createStoredTransaction(params);
      saveTransaction(tx);
      setTransactions((prev) => [tx, ...prev]);

      console.log('[TransactionHistory] Added transaction:', tx.id);
      return tx;
    },
    []
  );

  /**
   * Update a transaction in history
   */
  const updateTransactionInHistory = useCallback(
    (id: string, updates: Partial<Omit<StoredTransaction, 'id' | 'createdAt'>>) => {
      const updated = updateStoredTransaction(id, updates);

      if (updated) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? updated : tx))
        );
      }

      return updated;
    },
    []
  );

  /**
   * Remove a transaction from history
   */
  const removeTransaction = useCallback((id: string) => {
    // Stop any polling for this transaction
    const interval = pollingIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(id);
    }

    const removed = removeStoredTransaction(id);

    if (removed) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }

    return removed;
  }, []);

  /**
   * Poll for transaction status updates
   * Uses transaction ID to fetch latest state from storage (avoids stale closure)
   */
  const pollTransactionStatus = useCallback(
    async (txId: string) => {
      if (!mina || !isReady) {
        return;
      }

      // Fetch fresh transaction from storage to avoid stale closure
      const tx = transactions.find((t) => t.id === txId);
      if (!tx || !tx.txHash) {
        return;
      }

      // Skip if already completed or failed
      if (tx.status === 'completed' || tx.status === 'failed') {
        const interval = pollingIntervalsRef.current.get(txId);
        if (interval) {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(txId);
        }
        return;
      }

      try {
        const status = await mina.getStatus(tx.txHash);

        if (!status) {
          console.warn(`[TransactionHistory] No status found for ${txId}`);
          return;
        }

        // Update stored transaction based on status
        let newStatus: StoredTransactionStatus = tx.status;

        if (status.status === 'completed') {
          newStatus = 'completed';

          // Stop polling
          const interval = pollingIntervalsRef.current.get(txId);
          if (interval) {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(txId);
          }
        } else if (status.status === 'failed') {
          newStatus = 'failed';

          // Stop polling
          const interval = pollingIntervalsRef.current.get(txId);
          if (interval) {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(txId);
          }
        } else if (status.status === 'bridging' || status.status === 'depositing') {
          newStatus = 'executing';
        }

        // Update transaction in storage
        updateTransactionInHistory(txId, {
          status: newStatus,
          receivingTxHash: status.depositTxHash ?? tx.receivingTxHash,
        });
      } catch (err) {
        console.error(`[TransactionHistory] Failed to poll status for ${txId}:`, err);
      }
    },
    [mina, isReady, transactions, updateTransactionInHistory]
  );

  /**
   * Start polling for a specific transaction
   */
  const startPolling = useCallback(
    (tx: StoredTransaction) => {
      const txId = tx.id;

      // Don't poll if already polling
      if (pollingIntervalsRef.current.has(txId)) {
        return;
      }

      // Don't poll if completed or failed
      if (tx.status === 'completed' || tx.status === 'failed') {
        return;
      }

      // Poll immediately
      pollTransactionStatus(txId);

      // Then poll every 10 seconds using txId (not tx object) to avoid stale closure
      const interval = setInterval(() => {
        pollTransactionStatus(txId);
      }, 10000);

      pollingIntervalsRef.current.set(txId, interval);
      console.log(`[TransactionHistory] Started polling for ${txId}`);
    },
    [pollTransactionStatus]
  );

  /**
   * Resume pending transactions (poll for status updates)
   */
  const resumePending = useCallback(async () => {
    if (!mina || !isReady) {
      console.log('[TransactionHistory] SDK not ready, cannot resume pending');
      return;
    }

    const pending = getPendingTransactions();

    if (pending.length === 0) {
      console.log('[TransactionHistory] No pending transactions to resume');
      return;
    }

    console.log(`[TransactionHistory] Resuming ${pending.length} pending transactions`);
    setIsRestoringPending(true);

    // Start polling for each pending transaction
    pending.forEach((tx) => {
      if (tx.txHash) {
        startPolling(tx);
      }
    });

    setIsRestoringPending(false);
  }, [mina, isReady, startPolling]);

  /**
   * View a transaction (open execution modal with transaction state)
   */
  const viewTransaction = useCallback(
    (tx: StoredTransaction) => {
      // Set up execution state from stored transaction
      startExecution({
        executionId: tx.id,
        steps: tx.steps.map((step) => ({
          id: step.stepId,
          type: step.stepType,
        })),
        fromChainId: tx.fromChainId,
        toChainId: tx.toChainId,
      });

      // Update state to match stored transaction
      if (tx.status === 'completed') {
        setCompleted({
          txHash: tx.txHash ?? undefined,
          receivingTxHash: tx.receivingTxHash ?? undefined,
          receivedAmount: tx.receivedAmount ?? undefined,
        });
      } else if (tx.status === 'failed' && tx.error) {
        setFailed({
          message: tx.error,
          code: tx.errorDetails?.code,
          recoverable: tx.errorDetails?.recoverable,
          recoveryAction: tx.errorDetails?.recoveryAction,
          userMessage: tx.errorDetails?.userMessage,
        });
      }

      // Open the modal
      openModal();
    },
    [startExecution, setCompleted, setFailed, openModal]
  );

  /**
   * Get a specific transaction by ID
   */
  const getTransaction = useCallback(
    (id: string): StoredTransaction | undefined => {
      return transactions.find((tx) => tx.id === id);
    },
    [transactions]
  );

  return {
    transactions,
    isLoading,
    isRestoringPending,
    addTransaction,
    updateTransaction: updateTransactionInHistory,
    removeTransaction,
    resumePending,
    viewTransaction,
    getTransaction,
    startPolling,
  };
}

export default useTransactionHistory;
