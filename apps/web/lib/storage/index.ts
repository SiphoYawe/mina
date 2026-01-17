'use client';

// Transaction storage (localStorage)
export {
  getStoredTransactions,
  getStoredTransaction,
  getStoredTransactionsArray,
  getPendingTransactions,
  saveTransaction,
  updateTransaction,
  removeTransaction,
  cleanupOldTransactions,
  clearAllTransactions,
  createStoredTransaction,
  type StoredToken,
  type StoredTransactionStatus,
  type StoredTransaction,
} from './transactions';

// Pending bridges storage (IndexedDB + Background Sync)
export {
  openDB,
  savePendingBridge,
  getPendingBridges,
  getPendingBridgesForWallet,
  getPendingBridge,
  deletePendingBridge,
  clearAllPendingBridges,
  registerBackgroundSync,
  queueBridgeForOffline,
  isBackgroundSyncSupported,
  getSyncTag,
  getStoreName,
  getDBName,
  type PendingBridge,
} from './pending-bridges';
