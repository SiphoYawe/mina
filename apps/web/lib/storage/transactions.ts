'use client';

import type { UIStepStatus } from '@/lib/stores/transaction-store';

/**
 * Token information for stored transactions
 */
export interface StoredToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

/**
 * Transaction status types
 */
export type StoredTransactionStatus = 'pending' | 'executing' | 'completed' | 'failed';

/**
 * Stored transaction interface for persistence
 */
export interface StoredTransaction {
  /** Unique execution ID from SDK */
  id: string;
  /** Source transaction hash */
  txHash: string | null;
  /** Receiving/deposit transaction hash */
  receivingTxHash: string | null;
  /** Source chain ID */
  fromChainId: number;
  /** Destination chain ID */
  toChainId: number;
  /** Source chain name */
  fromChainName: string;
  /** Destination chain name */
  toChainName: string;
  /** Source token */
  fromToken: StoredToken;
  /** Destination token */
  toToken: StoredToken;
  /** Amount being bridged */
  fromAmount: string;
  /** Expected received amount */
  toAmount: string;
  /** Actual received amount (if completed) */
  receivedAmount: string | null;
  /** Transaction status */
  status: StoredTransactionStatus;
  /** Execution steps */
  steps: UIStepStatus[];
  /** Current step index */
  currentStepIndex: number;
  /** Progress percentage */
  progress: number;
  /** Timestamp when transaction was created */
  createdAt: number;
  /** Timestamp when transaction was last updated */
  updatedAt: number;
  /** Error message if failed */
  error: string | null;
  /** Error details if failed */
  errorDetails: {
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  } | null;
}

/**
 * Storage key for transactions
 */
const STORAGE_KEY = 'mina-transactions';

/**
 * Maximum age in days before auto-cleanup
 */
const MAX_AGE_DAYS = 7;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all stored transactions from localStorage
 */
export function getStoredTransactions(): Record<string, StoredTransaction> {
  if (!isLocalStorageAvailable()) {
    return {};
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('[TransactionStorage] Failed to parse stored transactions:', err);
    return {};
  }
}

/**
 * Get a single stored transaction by ID
 */
export function getStoredTransaction(id: string): StoredTransaction | null {
  const transactions = getStoredTransactions();
  return transactions[id] || null;
}

/**
 * Get all stored transactions as an array, sorted by createdAt descending
 */
export function getStoredTransactionsArray(): StoredTransaction[] {
  const transactions = getStoredTransactions();
  return Object.values(transactions).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get pending transactions (pending or executing status)
 */
export function getPendingTransactions(): StoredTransaction[] {
  const transactions = getStoredTransactionsArray();
  return transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'executing'
  );
}

/**
 * Save a transaction to localStorage
 */
export function saveTransaction(tx: StoredTransaction): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[TransactionStorage] localStorage not available');
    return;
  }

  try {
    const stored = getStoredTransactions();
    stored[tx.id] = tx;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error('[TransactionStorage] Failed to save transaction:', err);
  }
}

/**
 * Update a stored transaction
 */
export function updateTransaction(
  id: string,
  updates: Partial<Omit<StoredTransaction, 'id' | 'createdAt'>>
): StoredTransaction | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = getStoredTransactions();
    const existing = stored[id];

    if (!existing) {
      console.warn('[TransactionStorage] Transaction not found:', id);
      return null;
    }

    const updated: StoredTransaction = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    stored[id] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    return updated;
  } catch (err) {
    console.error('[TransactionStorage] Failed to update transaction:', err);
    return null;
  }
}

/**
 * Remove a transaction from localStorage
 */
export function removeTransaction(id: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const stored = getStoredTransactions();

    if (!stored[id]) {
      return false;
    }

    delete stored[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch (err) {
    console.error('[TransactionStorage] Failed to remove transaction:', err);
    return false;
  }
}

/**
 * Clean up transactions older than MAX_AGE_DAYS
 * @returns Number of transactions removed
 */
export function cleanupOldTransactions(): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  try {
    const stored = getStoredTransactions();
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    Object.keys(stored).forEach((id) => {
      const tx = stored[id];
      if (tx && tx.createdAt < cutoff) {
        delete stored[id];
        removedCount++;
      }
    });

    if (removedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      console.log(`[TransactionStorage] Cleaned up ${removedCount} old transactions`);
    }

    return removedCount;
  } catch (err) {
    console.error('[TransactionStorage] Failed to cleanup old transactions:', err);
    return 0;
  }
}

/**
 * Clear all stored transactions
 */
export function clearAllTransactions(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[TransactionStorage] Failed to clear transactions:', err);
  }
}

/**
 * Create a new stored transaction from execution start
 */
export function createStoredTransaction(params: {
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
}): StoredTransaction {
  const now = Date.now();

  return {
    id: params.executionId,
    txHash: null,
    receivingTxHash: null,
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    fromChainName: params.fromChainName,
    toChainName: params.toChainName,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    toAmount: params.toAmount,
    receivedAmount: null,
    status: 'pending',
    steps: params.steps,
    currentStepIndex: 0,
    progress: 0,
    createdAt: now,
    updatedAt: now,
    error: null,
    errorDetails: null,
  };
}
