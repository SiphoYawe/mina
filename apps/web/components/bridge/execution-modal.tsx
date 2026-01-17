'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, XCircle, ExternalLink, ArrowRight, RefreshCw, ChevronDown, ChevronUp, Copy, Check, RotateCcw, WifiOff, Loader2 } from 'lucide-react';
import { ConfettiCelebration } from '@/components/shared/confetti';
import { useUIStore } from '@/lib/stores/ui-store';
import { copyToClipboard } from '@/lib/utils/share';
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
  receivedAmount,
  autoDepositCompleted,
  finalTradingBalance,
  onBridgeAgain,
  onClose,
}: {
  receivedAmount: string | null;
  autoDepositCompleted: boolean;
  finalTradingBalance: string | null;
  onBridgeAgain?: () => void;
  onClose: () => void;
}) {
  const { triggerConfetti } = useUIStore();

  // Trigger confetti celebration on mount (when success content is shown)
  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

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

      </DialogBody>

      <DialogFooter className="flex-col gap-3">
        {/* Primary CTA: Bridge Again */}
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
    const success = await copyToClipboard(details);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
 * REDESIGN: "Cosmic Luxe" - Globe as hero element with premium dark aesthetic
 * - Vertical stack layout for all screen sizes
 * - Large, prominent globe with atmospheric glow
 * - Compact horizontal stepper below
 * - Subtle animations and premium polish
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
  const currentStep = steps[currentStepIndex];
  const stepLabels = ['Approve', 'Swap', 'Bridge', 'Deposit'];

  return (
    <DialogBody className="relative overflow-hidden py-3 sm:py-4">
      {/* Atmospheric background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(125,211,252,0.15) 0%, rgba(14,165,233,0.05) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Hero Globe Container */}
      <div className="relative flex flex-col items-center">
        {/* Globe Visualization - HERO SIZE (DIALOG-004 Fix: Reduced mobile size to prevent cutoff) */}
        <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, transparent 50%, rgba(125,211,252,0.1) 70%, transparent 100%)',
            }}
          />

          {/* Globe wrapper with subtle border glow */}
          <div className="absolute inset-2 rounded-full overflow-hidden ring-1 ring-accent-primary/20 shadow-[0_0_60px_rgba(125,211,252,0.15)]">
            <GlobeVisualization className="w-full h-full" />
          </div>

          {/* Orbital progress indicator */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(125,211,252,0.1)"
              strokeWidth="1"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${progress * 3.01} 301`}
              className="transition-all duration-500 ease-out"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(125,211,252,0.5))',
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#0ECC83" />
              </linearGradient>
            </defs>
          </svg>

          {/* Progress percentage badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-bg-elevated/90 backdrop-blur-sm rounded-full border border-accent-primary/30 shadow-lg">
            <span className="text-lg font-mono font-bold bg-gradient-to-r from-accent-primary to-success bg-clip-text text-transparent">
              {progress}%
            </span>
          </div>
        </div>

        {/* Current Step Indicator */}
        <div className="mt-4 text-center">
          <p className="text-body text-text-primary font-medium">
            {currentStep?.message || 'Processing...'}
          </p>
          <p className="text-caption text-text-muted mt-1">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Compact Horizontal Stepper */}
      <div className="mt-4 px-2">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isFailed = step.status === 'failed';
            const isPending = step.status === 'pending';

            return (
              <React.Fragment key={step.stepId}>
                {/* Step dot */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                      isCompleted && 'bg-success text-bg-base shadow-[0_0_12px_rgba(14,204,131,0.4)]',
                      isActive && 'bg-accent-primary text-bg-base animate-pulse shadow-[0_0_12px_rgba(125,211,252,0.5)]',
                      isFailed && 'bg-error text-white',
                      isPending && 'bg-bg-elevated border border-border-default text-text-muted'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFailed ? (
                      '!'
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    'text-caption font-medium whitespace-nowrap',
                    isCompleted && 'text-success',
                    isActive && 'text-accent-primary',
                    isFailed && 'text-error',
                    isPending && 'text-text-muted'
                  )}>
                    {stepLabels[index] || 'Step'}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-6">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isCompleted
                          ? 'bg-gradient-to-r from-success to-success/50'
                          : 'bg-border-default'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Minimal warning */}
      <p className="mt-3 text-caption text-text-muted text-center opacity-60">
        Keep this window open while bridging
      </p>
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

  // Use wider dialog when executing to accommodate hero globe
  const isWideMode = status === 'executing' || status === 'pending' || isRetrying;

  return (
    <Dialog open={isModalOpen} onOpenChange={canClose ? closeModal : () => {}}>
      <DialogContent
        className={cn(
          // Base sizing for non-executing states
          'max-w-md',
          // DIALOG-003 Fix: Hero globe mode needs more width
          isWideMode && 'max-w-[420px] sm:max-w-[460px] md:max-w-[500px]'
        )}
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
            receivedAmount={receivedAmount}
            autoDepositCompleted={autoDepositCompleted}
            finalTradingBalance={finalTradingBalance}
            onBridgeAgain={onBridgeAgain}
            onClose={handleClose}
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
