'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, XCircle, ExternalLink, ArrowRight, RefreshCw, ChevronDown, ChevronUp, Copy, Check, RotateCcw, WifiOff, TrendingUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfettiCelebration } from '@/components/shared/confetti';
import { ShareReceiptButton } from '@/components/shared/share-receipt';
import { useUIStore } from '@/lib/stores/ui-store';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import type { ShareReceiptData } from '@/lib/utils/share';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExecutionStepper } from './execution-stepper';
import { useTransactionStore, type UIStepStatus } from '@/lib/stores/transaction-store';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { chainConfigs } from '@/lib/config/chain-configs';
import { usePearAuth } from '@/lib/pear';

// Lazy load globe visualization to avoid bundle bloat (Story 9.6)
const GlobeVisualization = dynamic(
  () => import('./globe-visualization').then(mod => mod.GlobeVisualization),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center bg-bg-base rounded-lg">
        <div className="w-16 h-16 rounded-full bg-accent-primary/10 animate-pulse" />
      </div>
    ),
  }
);

/**
 * Comprehensive Explorer URLs by chain ID
 * Covers 40+ EVM chains supported by the app
 * EXEC-001 Fix: Expanded from 12 to 40+ chains
 */
const EXPLORER_URLS: Record<number, string> = {
  // Major L1s
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  250: 'https://ftmscan.com/tx/',
  43114: 'https://snowtrace.io/tx/',
  100: 'https://gnosisscan.io/tx/',
  42220: 'https://celoscan.io/tx/',
  1313161554: 'https://aurorascan.dev/tx/',
  1284: 'https://moonscan.io/tx/',
  1285: 'https://moonriver.moonscan.io/tx/',

  // L2s and Rollups
  10: 'https://optimistic.etherscan.io/tx/',
  42161: 'https://arbiscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  324: 'https://explorer.zksync.io/tx/',
  59144: 'https://lineascan.build/tx/',
  534352: 'https://scrollscan.com/tx/',
  5000: 'https://explorer.mantle.xyz/tx/',
  1088: 'https://andromeda-explorer.metis.io/tx/',
  1101: 'https://zkevm.polygonscan.com/tx/',
  81457: 'https://blastscan.io/tx/',
  34443: 'https://explorer.mode.network/tx/',
  7777777: 'https://explorer.zora.energy/tx/',

  // Other L2s
  169: 'https://pacific-explorer.manta.network/tx/',
  252: 'https://fraxscan.com/tx/',
  288: 'https://bobascan.com/tx/',
  1116: 'https://scan.coredao.org/tx/',
  2222: 'https://kavascan.io/tx/',
  7700: 'https://cantoscan.com/tx/',
  8217: 'https://klaytnscope.com/tx/',
  32659: 'https://fsnscan.com/tx/',
  42170: 'https://nova.arbiscan.io/tx/',
  204: 'https://opbnbscan.com/tx/',
  196: 'https://www.oklink.com/xlayer/tx/',
  1135: 'https://explorer.lisk.com/tx/',
  167000: 'https://taikoscan.io/tx/',
  4202: 'https://sepolia.lisk.com/tx/',

  // Testnets
  5: 'https://goerli.etherscan.io/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
  421614: 'https://sepolia.arbiscan.io/tx/',
  84532: 'https://sepolia.basescan.org/tx/',
  11155420: 'https://sepolia-optimism.etherscan.io/tx/',

  // HyperEVM
  998: 'https://explorer.hyperliquid-testnet.xyz/tx/', // HyperEVM Testnet
  999: 'https://explorer.hyperliquid.xyz/tx/', // HyperEVM Mainnet
};

/**
 * Get explorer URL for a transaction
 * EXEC-001 Fix: Falls back to chainConfigs if not in static map
 */
function getExplorerUrl(chainId: number | null, txHash: string): string | null {
  if (!chainId) {
    return null;
  }

  // First try the static explorer URLs
  if (EXPLORER_URLS[chainId]) {
    return `${EXPLORER_URLS[chainId]}${txHash}`;
  }

  // Fall back to chainConfigs for additional chains
  const chainConfig = chainConfigs[chainId];
  if (chainConfig?.blockExplorerUrls?.[0]) {
    const baseUrl = chainConfig.blockExplorerUrls[0];
    // Ensure URL ends with /tx/
    const explorerUrl = baseUrl.endsWith('/') ? `${baseUrl}tx/` : `${baseUrl}/tx/`;
    return `${explorerUrl}${txHash}`;
  }

  return null;
}

/**
 * Props for ExecutionModal
 */
export interface ExecutionModalProps {
  /** Callback when user clicks "Bridge Again" */
  onBridgeAgain?: () => void;
  /** Callback when user clicks "Start Over" to reset form and get new quote */
  onStartOver?: () => void;
  /** Callback to retry failed execution */
  onRetry?: () => Promise<void>;
  /** Whether a retry is currently in progress */
  isRetrying?: boolean;
}

/**
 * Hyperliquid trading app URL
 */
const HYPERLIQUID_TRADING_URL = 'https://app.hyperliquid.xyz/trade';

/**
 * Success state content
 */
function SuccessContent({
  txHash,
  receivingTxHash,
  receivedAmount,
  fromChainId,
  toChainId,
  autoDepositCompleted,
  depositTxHash,
  finalTradingBalance,
  onBridgeAgain,
  onClose,
  startedAt,
}: {
  txHash: string | null;
  receivingTxHash: string | null;
  receivedAmount: string | null;
  fromChainId: number | null;
  toChainId: number | null;
  autoDepositCompleted: boolean;
  depositTxHash: string | null;
  finalTradingBalance: string | null;
  onBridgeAgain?: () => void;
  onClose: () => void;
  startedAt: number | null;
}) {
  const router = useRouter();
  const sourceExplorerUrl = txHash && fromChainId ? getExplorerUrl(fromChainId, txHash) : null;
  const destExplorerUrl = receivingTxHash && toChainId ? getExplorerUrl(toChainId, receivingTxHash) : null;
  const depositExplorerUrl = depositTxHash ? getExplorerUrl(999, depositTxHash) : null;
  const { triggerConfetti } = useUIStore();
  const { sourceChain, sourceToken, amount } = useBridgeStore();

  // Pear Protocol auth
  const { isAuthenticated: isPearAuthenticated, isAuthenticating: isPearAuthenticating, authenticate: authenticatePear, authError: pearAuthError } = usePearAuth();
  const [showPearPrompt, setShowPearPrompt] = useState(false);
  const [pearAuthDeclined, setPearAuthDeclined] = useState(false);

  // Build receipt data for sharing
  const receiptData: ShareReceiptData | null = txHash && sourceChain && sourceToken && receivedAmount ? {
    txHash,
    fromChain: { name: sourceChain.name, id: sourceChain.id },
    toChain: { name: 'Hyperliquid', id: toChainId || 999 },
    fromToken: { symbol: sourceToken.symbol, amount: amount || '0' },
    toToken: { symbol: 'USDC', amount: receivedAmount },
    timestamp: startedAt || Date.now(),
  } : null;

  // Trigger confetti celebration on mount (when success content is shown)
  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  // Show Pear prompt after 1 second (only if auto-deposit completed and not already authenticated)
  useEffect(() => {
    if (autoDepositCompleted && !isPearAuthenticated && !pearAuthDeclined) {
      const timer = setTimeout(() => {
        setShowPearPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDepositCompleted, isPearAuthenticated, pearAuthDeclined]);

  // Handle Pear authentication
  const handleEnableTrading = useCallback(async () => {
    const success = await authenticatePear();
    if (success) {
      onClose();
      router.push('/trade');
    }
  }, [authenticatePear, onClose, router]);

  // Handle declining Pear auth
  const handleDeclinePear = useCallback(() => {
    setPearAuthDeclined(true);
    setShowPearPrompt(false);
  }, []);

  // Go directly to trade page if already authenticated
  const handleGoToTrade = useCallback(() => {
    onClose();
    router.push('/trade');
  }, [onClose, router]);

  return (
    <>
      {/* Confetti animation - renders to its own canvas */}
      <ConfettiCelebration />
      <DialogBody className="text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        {/* Success message - different for auto-deposit */}
        {autoDepositCompleted ? (
          <>
            <h3 className="text-h3 text-text-primary mb-2">Bridge & Deposit Complete!</h3>
            <p className="text-body text-text-muted mb-6">
              Your assets have been bridged and deposited to your Hyperliquid trading account.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-h3 text-text-primary mb-2">Bridge Complete!</h3>
            <p className="text-body text-text-muted mb-6">
              Your assets have been successfully bridged to HyperEVM.
            </p>
          </>
        )}

        {/* Amount and Balance Summary */}
        <div className="space-y-3 mb-6">
          {/* Amount received */}
          {receivedAmount && (
            <div className="bg-bg-elevated rounded-card p-4">
              <p className="text-caption text-text-muted mb-1">
                {autoDepositCompleted ? 'Amount Deposited' : 'Amount Received'}
              </p>
              <p className="text-h2 text-text-primary font-mono">
                {receivedAmount} <span className="text-body text-text-muted">USDC</span>
              </p>
            </div>
          )}

          {/* Final trading balance - only show if auto-deposit completed */}
          {autoDepositCompleted && finalTradingBalance && (
            <div className="bg-bg-elevated rounded-card p-4 border border-success/20">
              <p className="text-caption text-text-muted mb-1">Trading Account Balance</p>
              <p className="text-h3 text-success font-mono">
                {finalTradingBalance} <span className="text-body text-text-muted">USDC</span>
              </p>
              <p className="text-caption text-text-muted mt-1">Ready to trade on Hyperliquid</p>
            </div>
          )}
        </div>

        {/* Pear Trading Prompt - Show after auto-deposit complete */}
        {autoDepositCompleted && showPearPrompt && !isPearAuthenticated && (
          <div className="mb-6 p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
              <h4 className="text-body font-medium text-text-primary">Start Pair Trading</h4>
            </div>
            <p className="text-small text-text-muted mb-4">
              Sign to enable pair trading on Hyperliquid via Pear Protocol. Trade 30,000+ pairs with advanced strategies.
            </p>
            {pearAuthError && (
              <p className="text-small text-error mb-3">{pearAuthError}</p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={handleEnableTrading}
                disabled={isPearAuthenticating}
              >
                {isPearAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Enable Trading
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeclinePear}
                disabled={isPearAuthenticating}
              >
                Later
              </Button>
            </div>
          </div>
        )}

        {/* Explorer links */}
        <div className="space-y-3 mb-2">
          {sourceExplorerUrl && (
            <a
              href={sourceExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-elevated hover:bg-bg-surface transition-colors text-body text-text-primary"
            >
              <span>View Source Transaction</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {destExplorerUrl && !autoDepositCompleted && (
            <a
              href={destExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-elevated hover:bg-bg-surface transition-colors text-body text-text-primary"
            >
              <span>View on HyperEVM Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {depositExplorerUrl && autoDepositCompleted && (
            <a
              href={depositExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-elevated hover:bg-bg-surface transition-colors text-body text-text-primary"
            >
              <span>View Deposit Transaction</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Share Receipt Button */}
        {receiptData && (
          <div className="flex justify-center mb-4">
            <ShareReceiptButton receipt={receiptData} />
          </div>
        )}
      </DialogBody>

      <DialogFooter className="flex-col gap-3">
        {/* Primary CTA based on state */}
        {autoDepositCompleted ? (
          isPearAuthenticated ? (
            // Already authenticated with Pear - go to trade page
            <Button
              className="w-full hover:shadow-glow"
              size="lg"
              onClick={handleGoToTrade}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Pair Trading
            </Button>
          ) : (
            // Not authenticated - link to Hyperliquid (fallback)
            <a
              href={HYPERLIQUID_TRADING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full hover:shadow-glow" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                Start Trading on Hyperliquid
              </Button>
            </a>
          )
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onClose();
              onBridgeAgain?.();
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Bridge Again
          </Button>
        )}

        {/* Secondary: Bridge Again (if auto-deposit completed) */}
        {autoDepositCompleted && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onClose();
              onBridgeAgain?.();
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Bridge Again
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Error Details Expandable Component
 */
function ErrorDetails({
  error,
  errorDetails,
}: {
  error: string | null;
  errorDetails: {
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyDetails = useCallback(async () => {
    const details = JSON.stringify({
      code: errorDetails?.code,
      message: error,
      recoverable: errorDetails?.recoverable,
      recoveryAction: errorDetails?.recoveryAction,
      userMessage: errorDetails?.userMessage,
      timestamp: new Date().toISOString(),
    }, null, 2);
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ErrorDetails] Failed to copy to clipboard:', err);
    }
  }, [error, errorDetails]);

  return (
    <div className="text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-caption text-text-muted hover:text-text-primary transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Technical Details
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-bg-elevated rounded-lg border border-border-subtle">
          <pre className="text-xs font-mono text-text-muted overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify({
              code: errorDetails?.code,
              message: error,
              recoverable: errorDetails?.recoverable,
              recoveryAction: errorDetails?.recoveryAction,
            }, null, 2)}
          </pre>
          <button
            onClick={copyDetails}
            className="mt-2 flex items-center gap-1 text-caption text-accent-primary hover:text-accent-hover transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy Error Details
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Recovery Guidance Component
 * ERR-003 Fix: Added wallet disconnect handling
 */
function RecoveryGuidance({ recoveryAction, isDepositError, isWalletDisconnect }: { recoveryAction?: string; isDepositError?: boolean; isWalletDisconnect?: boolean }) {
  if (!recoveryAction && !isDepositError && !isWalletDisconnect) return null;

  const guidance = getRecoverySuggestion(recoveryAction || '');

  return (
    <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle text-left">
      {/* Wallet disconnect warning */}
      {isWalletDisconnect && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded bg-warning/10 border border-warning/20">
          <WifiOff className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-small text-warning font-medium">
            Wallet connection lost
          </p>
        </div>
      )}
      {isDepositError && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded bg-success/10 border border-success/20">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          <p className="text-small text-success font-medium">
            Your USDC is safe on HyperEVM
          </p>
        </div>
      )}
      <p className="text-small font-medium text-text-primary mb-1">What you can do:</p>
      <p className="text-small text-text-muted">{guidance}</p>
      {isDepositError && (
        <a
          href="https://app.hyperliquid.xyz/portfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-small text-accent-primary hover:text-accent-hover transition-colors"
        >
          <span>Deposit manually on Hyperliquid</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

/**
 * Failed state content
 * ERR-003 Fix: Added wallet disconnect error handling
 */
function FailedContent({
  error,
  errorDetails,
  onRetry,
  onStartOver,
  onClose,
  isRetrying,
}: {
  error: string | null;
  errorDetails: {
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  } | null;
  onRetry?: () => void;
  onStartOver?: () => void;
  onClose: () => void;
  isRetrying?: boolean;
}) {
  // Explicitly check for true, not just "not false"
  const canRetry = errorDetails?.recoverable === true;
  const isDepositError = errorDetails?.code === 'DEPOSIT_FAILED';
  const isWalletDisconnect = errorDetails?.code === 'WALLET_DISCONNECTED';
  const userMessage = errorDetails?.userMessage || error || 'An error occurred during the bridge transaction.';

  return (
    <>
      <DialogBody>
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-error" />
          </div>
        </div>

        {/* Error message */}
        <div className="text-center mb-6">
          <h3 className="text-h3 text-text-primary mb-2">Transaction Failed</h3>
          <p className="text-body text-text-muted">
            {userMessage}
          </p>
        </div>

        {/* Error code badge */}
        {errorDetails?.code && (
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-error/10 text-error text-caption font-mono rounded-full">
              {errorDetails.code}
            </span>
          </div>
        )}

        {/* Recovery guidance for non-recoverable errors, deposit errors, or wallet disconnect */}
        {(!canRetry || isDepositError || isWalletDisconnect) && (
          <div className="mb-4">
            <RecoveryGuidance
              recoveryAction={errorDetails?.recoveryAction}
              isDepositError={isDepositError}
              isWalletDisconnect={isWalletDisconnect}
            />
          </div>
        )}

        {/* Expandable technical details */}
        <div className="mb-4">
          <ErrorDetails error={error} errorDetails={errorDetails} />
        </div>
      </DialogBody>

      <DialogFooter className="flex-col gap-3">
        {/* Retry button for recoverable errors */}
        {canRetry && onRetry && (
          <Button
            className="w-full"
            size="lg"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Transaction
              </>
            )}
          </Button>
        )}

        {/* Start Over button */}
        {onStartOver && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onClose();
              onStartOver();
            }}
            disabled={isRetrying}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        )}

        {/* Close/Cancel button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
          disabled={isRetrying}
        >
          {canRetry ? 'Cancel' : 'Close'}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Get user-friendly recovery suggestion
 */
function getRecoverySuggestion(action: string): string {
  switch (action) {
    case 'retry':
      return 'Try the transaction again.';
    case 'add_funds':
      return 'Add more funds to your wallet and try again.';
    case 'increase_slippage':
      return 'Try increasing the slippage tolerance.';
    case 'try_different_amount':
      return 'Try a different amount or token.';
    case 'fetch_new_quote':
      return 'Get a fresh quote and try again.';
    case 'try_again':
      return 'Please try the transaction again.';
    case 'switch_network':
      return 'Switch to the correct network and try again.';
    case 'contact_support':
      return 'If the issue persists, please contact support.';
    case 'retry_deposit':
      return 'You can retry the deposit or deposit manually from the Hyperliquid app.';
    case 'manual_deposit':
      return 'Your USDC is on HyperEVM. You can deposit manually from the Hyperliquid app.';
    case 'reconnect_wallet':
      return 'Reconnect your wallet and try the transaction again. If a transaction was already submitted, check the explorer - it may still complete successfully.';
    default:
      return 'Please try again or contact support if the issue persists.';
  }
}

/**
 * Executing state content with Globe Visualization (Story 9.6)
 *
 * Layout:
 * - Desktop: Globe on left, stepper on right
 * - Mobile: Globe on top, stepper below
 */
function ExecutingContent({
  steps,
  currentStepIndex,
  progress,
}: {
  steps: UIStepStatus[];
  currentStepIndex: number;
  progress: number;
}) {
  return (
    <DialogBody>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-caption text-text-muted mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-muted transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Globe + Stepper Layout (responsive) */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Globe Visualization */}
        <div className="w-full md:w-1/2 flex-shrink-0">
          <div className="aspect-square max-w-[220px] mx-auto md:max-w-none">
            <GlobeVisualization
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <ExecutionStepper steps={steps} currentStepIndex={currentStepIndex} />
        </div>
      </div>

      {/* Warning message */}
      <div className="mt-4 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
        <p className="text-caption text-text-muted text-center">
          Please do not close this window while the transaction is in progress.
          This may take a few minutes.
        </p>
      </div>
    </DialogBody>
  );
}

/**
 * Execution Modal Component
 *
 * Displays the progress of a bridge transaction in a modal.
 * Shows different states:
 * - Executing: Shows stepper with progress
 * - Completed: Shows success state with explorer links
 * - Failed: Shows error state with retry option
 *
 * @example
 * ```tsx
 * <ExecutionModal
 *   onBridgeAgain={() => reset()}
 *   onStartOver={() => { reset(); setAmount(''); }}
 *   onRetry={() => retry(executionId)}
 *   isRetrying={isRetrying}
 * />
 * ```
 */
export function ExecutionModal({
  onBridgeAgain,
  onStartOver,
  onRetry,
  isRetrying = false,
}: ExecutionModalProps) {
  const {
    isModalOpen,
    status,
    steps,
    currentStepIndex,
    progress,
    txHash,
    receivingTxHash,
    receivedAmount,
    fromChainId,
    toChainId,
    error,
    errorDetails,
    autoDepositCompleted,
    depositTxHash,
    finalTradingBalance,
    startedAt,
    closeModal,
    reset,
    setFailed,
  } = useTransactionStore();

  // ERR-003 Fix: Monitor wallet connection state during execution
  const { isConnected, isDisconnected } = useAccount();
  const wasConnectedRef = useRef(isConnected);
  const [walletDisconnected, setWalletDisconnected] = useState(false);

  // Detect wallet disconnect during transaction
  useEffect(() => {
    // Only monitor during active execution
    if (status === 'executing' || status === 'pending') {
      // Check if wallet was connected before and is now disconnected
      if (wasConnectedRef.current && isDisconnected) {
        console.warn('[ExecutionModal] Wallet disconnected during transaction');
        setWalletDisconnected(true);
        setFailed({
          message: 'Wallet disconnected during transaction',
          code: 'WALLET_DISCONNECTED',
          recoverable: false,
          recoveryAction: 'reconnect_wallet',
          userMessage: 'Your wallet was disconnected during the transaction. Please reconnect your wallet and try again. Note: If the transaction was already submitted, it may still complete.',
        });
      }
    }

    // Update ref for next comparison
    wasConnectedRef.current = isConnected;
  }, [isConnected, isDisconnected, status, setFailed]);

  // Reset wallet disconnected state when modal closes or resets
  useEffect(() => {
    if (!isModalOpen) {
      setWalletDisconnected(false);
    }
  }, [isModalOpen]);

  // Handle close - only allow if not executing or retrying
  const handleClose = useCallback(() => {
    if (status !== 'executing' && status !== 'pending' && !isRetrying) {
      closeModal();
      if (status === 'completed') {
        reset();
      }
    }
  }, [status, isRetrying, closeModal, reset]);

  // Handle retry with error handling to prevent unhandled promise rejection
  const handleRetry = useCallback(async () => {
    if (onRetry) {
      try {
        await onRetry();
      } catch (err) {
        // Error is already handled by the onRetry callback and transaction store
        console.error('[ExecutionModal] Retry failed:', err);
      }
    }
  }, [onRetry]);

  // Handle start over
  const handleStartOver = useCallback(() => {
    reset();
    if (onStartOver) {
      onStartOver();
    }
  }, [reset, onStartOver]);

  // Get modal title based on status
  const getTitle = () => {
    if (isRetrying) {
      return 'Retrying Transaction...';
    }
    switch (status) {
      case 'pending':
        return 'Preparing Transaction...';
      case 'executing':
        return 'Bridging in Progress';
      case 'completed':
        return autoDepositCompleted ? 'Bridge & Deposit Complete' : 'Bridge Complete';
      case 'failed':
        return errorDetails?.code === 'DEPOSIT_FAILED' ? 'Deposit Failed' : 'Transaction Failed';
      default:
        return 'Bridge Transaction';
    }
  };

  // Determine if modal can be closed
  const canClose = status !== 'executing' && status !== 'pending' && !isRetrying;

  // Use wider dialog when executing to accommodate globe + stepper
  const isWideMode = status === 'executing' || status === 'pending' || isRetrying;

  return (
    <Dialog open={isModalOpen} onOpenChange={canClose ? closeModal : () => {}}>
      <DialogContent
        className={cn('max-w-lg', isWideMode && 'md:max-w-2xl')}
        onClose={canClose ? handleClose : undefined}
        showCloseButton={canClose}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {/* Render content based on status */}
        {(status === 'executing' || status === 'pending' || isRetrying) && (
          <ExecutingContent
            steps={steps}
            currentStepIndex={currentStepIndex}
            progress={progress}
          />
        )}

        {status === 'completed' && !isRetrying && (
          <SuccessContent
            txHash={txHash}
            receivingTxHash={receivingTxHash}
            receivedAmount={receivedAmount}
            fromChainId={fromChainId}
            toChainId={toChainId}
            autoDepositCompleted={autoDepositCompleted}
            depositTxHash={depositTxHash}
            finalTradingBalance={finalTradingBalance}
            onBridgeAgain={onBridgeAgain}
            onClose={handleClose}
            startedAt={startedAt}
          />
        )}

        {status === 'failed' && !isRetrying && (
          <FailedContent
            error={error}
            errorDetails={errorDetails}
            onRetry={handleRetry}
            onStartOver={handleStartOver}
            onClose={handleClose}
            isRetrying={isRetrying}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExecutionModal;
