'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, ArrowDown, ArrowRight, RefreshCw, Info, Loader2, AlertTriangle, XCircle, TrendingUp, Play, ChevronDown, Sparkles, Zap, Coins } from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { ChainSelector } from './chain-selector';
import { TokenSelector } from './token-selector';
import { QuoteDisplay } from './quote-display';
import { BalanceWarning } from './balance-warning';
import { AutoDepositToggle } from './auto-deposit-toggle';
import { ExecutionModal } from './execution-modal';
import { SettingsPanel } from './settings-panel';
import { BridgeModeToggle } from './bridge-mode-toggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkSwitchPrompt } from '@/components/wallet';
import { useChains, useNetworkSwitchNeeded, useNetworkSwitch, useWalletBalance, useBridgeQuote, useBalanceValidation, useBridgeExecution, useTransactionHistory } from '@/lib/hooks';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useMina } from '@/app/providers';
import { cn } from '@/lib/utils';
import type { Chain, Token, Quote } from '@siphoyawe/mina-sdk';

/**
 * Constants for amount validation
 */
const MIN_BRIDGE_AMOUNT_USD = 1; // Minimum $1 worth to bridge
const MAX_BRIDGE_AMOUNT_USD = 100000; // Maximum $100k per transaction (safety limit)

/**
 * Destination Chain Display
 * Shows HyperEVM as the fixed destination
 */
function DestinationChainDisplay() {
  return (
    <div className="flex items-center gap-3 h-12 px-4 rounded-card border border-border-default bg-bg-surface/50">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-bg-base">H</span>
      </div>
      <span className="text-body text-text-primary">HyperEVM</span>
      <span className="ml-auto text-caption text-text-muted">(Destination)</span>
    </div>
  );
}

/**
 * Tooltip component for bridge button
 * TOOLTIP-001 Fix: Added max-width and word wrap for mobile viewport
 */
function BridgeButtonTooltip({ show, children, message }: { show: boolean; children: React.ReactNode; message: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {children}
      {show && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-lg shadow-lg z-10 max-w-[min(300px,calc(100vw-2rem))] text-wrap animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-caption text-text-primary">{message}</span>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-border-default" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Amount validation interface
 */
interface AmountValidation {
  isValid: boolean;
  message: string | null;
  severity: 'warning' | 'error';
}

/**
 * Amount validation warning component (QUOTE-001)
 * Shows helpful messages when amount is out of valid range
 */
function AmountValidationWarning({ validation }: { validation: AmountValidation }) {
  if (validation.isValid || !validation.message) return null;

  const isError = validation.severity === 'error';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-small',
        isError
          ? 'bg-error/10 border border-error/20 text-error'
          : 'bg-warning/10 border border-warning/20 text-warning'
      )}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{validation.message}</span>
    </div>
  );
}

/**
 * Token load error component with retry option (ERR-001)
 */
function TokenLoadError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20">
      <XCircle className="w-5 h-5 text-error flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="text-small font-medium text-error">Failed to load tokens</p>
        <p className="text-caption text-text-muted">
          Unable to fetch available tokens for this chain.
        </p>
      </div>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className={cn(
          'px-3 py-1.5 rounded-lg text-small font-medium transition-colors',
          'bg-error/20 text-error hover:bg-error/30',
          isRetrying && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isRetrying ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Retrying...
          </span>
        ) : (
          'Retry'
        )}
      </button>
    </div>
  );
}

/**
 * Exchange rate display component (QUOTE-002)
 * Shows the conversion rate between source and destination tokens
 */
function ExchangeRateDisplay({ quote, className }: { quote: Quote; className?: string }) {
  // Calculate exchange rate: toAmount / fromAmount (adjusted for decimals)
  const rate = useMemo(() => {
    const fromAmountNum = parseFloat(quote.fromAmount) / Math.pow(10, quote.fromToken.decimals);
    const toAmountNum = parseFloat(quote.toAmount) / Math.pow(10, quote.toToken.decimals);

    if (fromAmountNum === 0) return null;

    const exchangeRate = toAmountNum / fromAmountNum;

    // Format based on magnitude
    if (exchangeRate >= 1000) {
      return exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (exchangeRate >= 1) {
      return exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } else {
      return exchangeRate.toLocaleString(undefined, { maximumSignificantDigits: 4 });
    }
  }, [quote]);

  if (!rate) return null;

  return (
    <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface/50 border border-border-subtle", className)}>
      <span className="text-caption text-text-muted">Exchange Rate</span>
      <span className="text-small text-text-secondary font-medium">
        1 {quote.fromToken.symbol} ≈ {rate} {quote.toToken.symbol}
      </span>
    </div>
  );
}

/**
 * Route type icon mapping
 */
const ROUTE_TYPE_ICONS = {
  fastest: Zap,
  cheapest: Coins,
  recommended: Sparkles,
} as const;

/**
 * Alternative routes display component (QUOTE-003)
 * Shows alternative routes with trade-offs when available
 * Enhanced design with better visual hierarchy and polish
 */
function AlternativeRoutesDisplay({ quote, className }: { quote: Quote; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to only show routes that are different from the currently selected route
  const differentRoutes = quote.alternativeRoutes?.filter(
    (route) => route.type !== quote.routePreference
  ) || [];

  // Hide if no different routes available
  if (differentRoutes.length === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes}m`;
  };

  // Get the icon for the current route
  const CurrentRouteIcon = ROUTE_TYPE_ICONS[quote.routePreference as keyof typeof ROUTE_TYPE_ICONS] || Sparkles;

  return (
    <div className={cn(
      'rounded-xl overflow-hidden',
      'bg-gradient-to-b from-bg-surface/80 to-bg-base/60',
      'border border-border-subtle/60',
      'backdrop-blur-sm',
      'shadow-[0_2px_12px_rgba(0,0,0,0.15)]',
      className
    )}>
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3.5',
          'bg-gradient-to-r from-transparent via-accent-primary/[0.03] to-transparent',
          'hover:via-accent-primary/[0.06]',
          'transition-all duration-200',
          'group'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            'bg-accent-primary/10 border border-accent-primary/20',
            'group-hover:bg-accent-primary/15 group-hover:border-accent-primary/30',
            'transition-colors duration-200'
          )}>
            <Info className="w-3.5 h-3.5 text-accent-primary" />
          </div>
          <span className="text-small text-text-secondary font-medium">
            {differentRoutes.length} alternative route{differentRoutes.length > 1 ? 's' : ''} available
          </span>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-text-muted',
          'transition-transform duration-300 ease-out',
          'group-hover:text-text-secondary',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cn(
          'px-4 pb-4 pt-2 space-y-3',
          'border-t border-border-subtle/50',
          'bg-gradient-to-b from-bg-base/30 to-transparent',
          'animate-in slide-in-from-top-2 duration-200'
        )}>
          {/* Current Route Indicator */}
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'bg-accent-primary/[0.08] border border-accent-primary/20'
          )}>
            <div className="w-6 h-6 rounded-md bg-accent-primary/20 flex items-center justify-center">
              <CurrentRouteIcon className="w-3.5 h-3.5 text-accent-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-text-muted">Current route:</span>
              <span className="text-small text-accent-primary font-semibold capitalize">
                {quote.routePreference}
              </span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
                'bg-accent-primary/20 text-accent-primary'
              )}>
                Selected
              </span>
            </div>
          </div>

          {/* Alternative Routes */}
          <div className="space-y-2">
            {differentRoutes.map((route) => {
              const RouteIcon = ROUTE_TYPE_ICONS[route.type as keyof typeof ROUTE_TYPE_ICONS] || Sparkles;
              const isSuccess = route.type === 'fastest';
              const isAccent = route.type === 'cheapest';
              const isWarning = route.type === 'recommended';

              return (
                <div
                  key={route.routeId}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    'bg-bg-surface/50 hover:bg-bg-surface/70',
                    'border border-border-subtle/50 hover:border-border-default/50',
                    'transition-all duration-150',
                    'group/route cursor-default'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'transition-colors duration-150',
                      isSuccess && 'bg-success/10 border border-success/20 group-hover/route:bg-success/15',
                      isAccent && 'bg-accent-primary/10 border border-accent-primary/20 group-hover/route:bg-accent-primary/15',
                      isWarning && 'bg-warning/10 border border-warning/20 group-hover/route:bg-warning/15'
                    )}>
                      <RouteIcon className={cn(
                        'w-4 h-4',
                        isSuccess && 'text-success',
                        isAccent && 'text-accent-primary',
                        isWarning && 'text-warning'
                      )} />
                    </div>
                    <span className={cn(
                      'text-small font-semibold capitalize',
                      isSuccess && 'text-success',
                      isAccent && 'text-accent-primary',
                      isWarning && 'text-warning'
                    )}>
                      {route.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Zap className="w-3 h-3" />
                      <span className="text-small tabular-nums">{formatTime(route.estimatedTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Coins className="w-3 h-3" />
                      <span className="text-small tabular-nums">${parseFloat(route.totalFees).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bridge Form Component
 *
 * Main form for initiating bridge transactions.
 * Integrates:
 * - Chain selection
 * - Network switch detection with enhanced prompt
 * - Amount input (placeholder for token selection)
 * - Transaction blocking when network mismatch
 * - Balance refresh after network switch
 */
export function BridgeForm() {
  const router = useRouter();
  const { open: openWalletModal } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const { chains, isLoading, error, refreshChains, failureCount, maxRetries } = useChains();
  const { needsSwitch, targetChainId } = useNetworkSwitchNeeded();
  const { refetchBalances } = useWalletBalance();
  const { isPending: isSwitchPending, status: switchStatus } = useNetworkSwitch();
  const { quote, isLoading: isQuoteLoading, error: quoteError, refetch: refetchQuote } = useBridgeQuote();
  const { warnings, isValid: isBalanceValid } = useBalanceValidation({ quote });
  const { execute, retry, isExecuting, isRetrying, reset: resetExecution, steps: executionSteps } = useBridgeExecution();
  const { addTransaction, updateTransaction } = useTransactionHistory();

  // State for managing dismissed prompt
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-deposit from persisted settings store
  const autoDepositEnabled = useSettingsStore((state) => state.autoDeposit);
  const setAutoDeposit = useSettingsStore((state) => state.setAutoDeposit);

  // Issue 2 fix: Use useShallow for state to batch subscriptions
  // Actions are stable references and can be selected directly - no need for getState()
  const { mode, sourceChain, sourceToken, amount, setSourceChain, setSourceToken, setAmount } = useBridgeStore(
    useShallow((state) => ({
      mode: state.mode,
      sourceChain: state.sourceChain,
      sourceToken: state.sourceToken,
      amount: state.amount,
      setSourceChain: state.setSourceChain,
      setSourceToken: state.setSourceToken,
      setAmount: state.setAmount,
    }))
  );

  // Determine if we're in simulation mode
  const isSimulateMode = mode === 'simulate';

  // Get Mina SDK for token fetching
  const { mina, isReady: isMinaReady } = useMina();

  // State for token loading and list
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  // ERR-001: Track token load errors for user feedback
  const [tokenLoadError, setTokenLoadError] = useState<Error | null>(null);
  const [isRetryingTokens, setIsRetryingTokens] = useState(false);

  // Find target chain for network switch prompt
  const targetChain = sourceChain && needsSwitch ? sourceChain : null;

  // Issue 8 fix: Use useRef to store refetchBalances to prevent memory leak from unstable reference
  const refetchBalancesRef = useRef(refetchBalances);
  useEffect(() => {
    refetchBalancesRef.current = refetchBalances;
  }, [refetchBalances]);

  // Reset dismissed state when chain selection changes
  useEffect(() => {
    setIsDismissed(false);
  }, [sourceChain?.id]);

  // Refresh balances when network switch succeeds
  useEffect(() => {
    if (switchStatus === 'success') {
      // Refresh balances for the new chain
      refetchBalancesRef.current();
      console.log('[BridgeForm] Network switched, refreshing balances');
    }
  }, [switchStatus]);

  // Also refresh balances when wallet chain changes
  useEffect(() => {
    if (isConnected && walletChainId) {
      // Small delay to ensure chain switch is complete
      const timer = setTimeout(() => {
        refetchBalancesRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, walletChainId]);

  // Auto-load tokens when chain changes
  // Uses a cancelled flag to prevent race conditions when rapidly switching chains
  useEffect(() => {
    let cancelled = false;
    const chainId = sourceChain?.id;

    async function loadTokensForChain() {
      if (!sourceChain || !mina || !isMinaReady) {
        setAvailableTokens([]);
        setTokenLoadError(null);
        return;
      }

      setIsLoadingTokens(true);
      setTokenLoadError(null); // Clear previous errors
      try {
        // Fetch bridgeable tokens for the selected chain
        const tokens = await mina.getBridgeableTokens(sourceChain.id);

        // Check if request was cancelled or chain changed during fetch
        if (cancelled) {
          console.log('[BridgeForm] Token load cancelled (chain changed)');
          return;
        }

        setAvailableTokens(tokens);
        setTokenLoadError(null); // Clear error on success

        if (tokens.length > 0) {
          // Auto-select USDC if available, otherwise first token (only if no token selected)
          if (!sourceToken) {
            const usdc = tokens.find(
              (t: Token) => t.symbol.toUpperCase() === 'USDC' || t.symbol.toUpperCase() === 'USDC.E'
            );
            const defaultToken = usdc ?? tokens[0]!;
            setSourceToken(defaultToken);
            console.log('[BridgeForm] Auto-selected token:', defaultToken.symbol);
          }
        } else {
          console.warn('[BridgeForm] No bridgeable tokens found for chain:', sourceChain.name);
          setSourceToken(null);
        }
      } catch (err) {
        // Don't update state if request was cancelled
        if (cancelled) return;

        console.error('[BridgeForm] Failed to load tokens:', err);
        setAvailableTokens([]);
        setSourceToken(null);
        // ERR-001: Track the error for user feedback
        setTokenLoadError(err instanceof Error ? err : new Error('Failed to load tokens'));
      } finally {
        // Don't update loading state if request was cancelled
        if (!cancelled) {
          setIsLoadingTokens(false);
        }
      }
    }

    loadTokensForChain();

    // Cleanup function to cancel in-flight requests
    return () => {
      cancelled = true;
    };
    // Note: sourceToken is intentionally not in deps to avoid re-fetching when token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceChain?.id, mina, isMinaReady, setSourceToken]);

  // ERR-001: Handler for retrying token load
  const handleRetryTokenLoad = useCallback(async () => {
    if (!sourceChain || !mina || !isMinaReady) return;

    setIsRetryingTokens(true);
    setTokenLoadError(null);

    try {
      const tokens = await mina.getBridgeableTokens(sourceChain.id);
      setAvailableTokens(tokens);
      setTokenLoadError(null);

      if (tokens.length > 0 && !sourceToken) {
        const usdc = tokens.find(
          (t: Token) => t.symbol.toUpperCase() === 'USDC' || t.symbol.toUpperCase() === 'USDC.E'
        );
        const defaultToken = usdc ?? tokens[0]!;
        setSourceToken(defaultToken);
      }
    } catch (err) {
      console.error('[BridgeForm] Retry failed:', err);
      setTokenLoadError(err instanceof Error ? err : new Error('Failed to load tokens'));
    } finally {
      setIsRetryingTokens(false);
    }
  }, [sourceChain, mina, isMinaReady, sourceToken, setSourceToken]);

  // QUOTE-001: Amount validation logic
  const amountValidation = useMemo((): AmountValidation => {
    // No validation needed if no amount entered
    if (!amount || !sourceToken) {
      return { isValid: true, message: null, severity: 'warning' };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: true, message: null, severity: 'warning' };
    }

    // Calculate USD value if token has price
    const tokenPrice = sourceToken.priceUsd ?? 0;
    const usdValue = numAmount * tokenPrice;
    // Round to 2 decimal places to avoid floating point precision issues
    const usdValueRounded = Math.round(usdValue * 100) / 100;

    // Check minimum amount
    if (tokenPrice > 0 && usdValueRounded < MIN_BRIDGE_AMOUNT_USD) {
      return {
        isValid: false,
        message: `Minimum bridge amount is $${MIN_BRIDGE_AMOUNT_USD}. Current value: $${usdValueRounded.toFixed(2)}`,
        severity: 'warning',
      };
    }

    // Check maximum amount (safety limit)
    if (tokenPrice > 0 && usdValueRounded > MAX_BRIDGE_AMOUNT_USD) {
      return {
        isValid: false,
        message: `Maximum bridge amount is $${MAX_BRIDGE_AMOUNT_USD.toLocaleString()}. Consider splitting into multiple transactions.`,
        severity: 'error',
      };
    }

    // Very small amounts warning (may result in dust)
    if (numAmount > 0 && numAmount < 0.0001) {
      return {
        isValid: false,
        message: 'Amount may be too small to bridge effectively due to fees.',
        severity: 'warning',
      };
    }

    return { isValid: true, message: null, severity: 'warning' };
  }, [amount, sourceToken]);

  // Handle chain selection
  const handleChainChange = useCallback((chain: Chain) => {
    setSourceChain(chain);
    setSourceToken(null); // Clear token when chain changes
    setIsDismissed(false); // Reset dismissed state
  }, [setSourceChain, setSourceToken]);

  // Handle token selection
  const handleTokenChange = useCallback((token: Token) => {
    setSourceToken(token);
  }, [setSourceToken]);

  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid numeric input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, [setAmount]);

  // Handle prompt dismiss
  const handlePromptDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Handle successful network switch
  const handleSwitchSuccess = useCallback(() => {
    setIsDismissed(false);
    // Balance refresh is handled by the useEffect above
  }, []);

  // Determine if we should show the network switch prompt
  const showNetworkPrompt = targetChain && !isDismissed;

  // Handle auto-deposit toggle (SETTINGS-003 fix: now properly triggers quote refetch)
  // The quote hook reads autoDeposit from settings store and includes it in query key,
  // so toggling will automatically refetch with the updated autoDeposit preference
  const handleAutoDepositToggle = useCallback((enabled: boolean) => {
    setAutoDeposit(enabled);
  }, [setAutoDeposit]);

  // Handle bridge execution
  const handleBridge = useCallback(async () => {
    if (!quote || !sourceChain) {
      console.error('[BridgeForm] No quote available');
      return;
    }

    console.log('[BridgeForm] Starting bridge execution');

    // Save transaction to history before execution
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    addTransaction({
      executionId,
      fromChainId: quote.fromToken.chainId,
      fromChainName: sourceChain.name,
      toChainId: quote.toToken.chainId,
      toChainName: 'HyperEVM',
      fromToken: {
        address: quote.fromToken.address,
        symbol: quote.fromToken.symbol,
        decimals: quote.fromToken.decimals,
        chainId: quote.fromToken.chainId,
      },
      toToken: {
        address: quote.toToken.address,
        symbol: quote.toToken.symbol,
        decimals: quote.toToken.decimals,
        chainId: quote.toToken.chainId,
      },
      fromAmount: quote.fromAmount,
      toAmount: quote.toAmount,
      steps: executionSteps,
    });

    // Pass the executionId to ensure consistency between transaction history and execution store
    const result = await execute(quote, { executionId });

    // Update transaction status based on result
    if (result.success) {
      console.log('[BridgeForm] Bridge completed successfully:', result);
      updateTransaction(executionId, {
        status: 'completed',
        txHash: result.txHash ?? null,
        receivingTxHash: result.receivingTxHash ?? null,
        receivedAmount: result.receivedAmount ?? null,
      });
      // Reset form amount after successful bridge
      setAmount('');
    } else {
      console.error('[BridgeForm] Bridge failed:', result.error);
      // Include error details for recovery guidance
      const errorObj = result.error as any;
      updateTransaction(executionId, {
        status: 'failed',
        error: result.error?.message ?? 'Bridge transaction failed',
        errorDetails: errorObj ? {
          code: errorObj.code,
          recoverable: errorObj.recoverable,
          recoveryAction: errorObj.recoveryAction,
          userMessage: errorObj.userMessage,
        } : null,
      });
    }
  }, [quote, sourceChain, execute, setAmount, addTransaction, updateTransaction, executionSteps]);

  // Handle bridge again (reset and refetch quote)
  const handleBridgeAgain = useCallback(() => {
    resetExecution();
    setAmount('');
  }, [resetExecution, setAmount]);

  // Handle start over (reset form completely)
  const handleStartOver = useCallback(() => {
    resetExecution();
    setAmount('');
  }, [resetExecution, setAmount]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    console.log('[BridgeForm] Retrying execution');
    const result = await retry();
    if (result.success) {
      console.log('[BridgeForm] Retry completed successfully:', result);
    } else {
      console.error('[BridgeForm] Retry failed:', result.error);
    }
  }, [retry]);

  // Handle demo trading - navigate to trade page in simulate mode
  const handleDemoTrading = useCallback(() => {
    console.log('[BridgeForm] Navigating to demo trading');
    router.push('/trade');
  }, [router]);

  // Get transaction store for demo execution
  const {
    startExecution: startDemoExecution,
    updateStep: updateDemoStep,
    setCompleted: setDemoCompleted,
  } = useTransactionStore();

  // Handle demo bridge preview - shows execution modal with simulated progress
  const handleDemoPreview = useCallback(async () => {
    if (!sourceChain || !sourceToken || !amount || !quote) return;

    console.log('[BridgeForm] Starting demo bridge preview');

    const demoExecutionId = `demo_${Date.now()}`;
    const demoSteps = [
      { id: 'approval', type: 'approval' as const },
      { id: 'swap', type: 'swap' as const },
      { id: 'bridge', type: 'bridge' as const },
      { id: 'deposit', type: 'deposit' as const },
    ];

    // Start demo execution
    startDemoExecution({
      executionId: demoExecutionId,
      steps: demoSteps,
      fromChainId: sourceChain.id,
      toChainId: 999, // HyperEVM
    });

    // Simulate progress through each step
    for (let i = 0; i < demoSteps.length; i++) {
      const step = demoSteps[i]!;

      // Mark step as active
      await new Promise(resolve => setTimeout(resolve, 800));
      updateDemoStep({
        stepId: step.id,
        step: step.type,
        status: 'active',
        txHash: null,
        error: null,
        timestamp: Date.now(),
      });

      // Mark step as completed
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateDemoStep({
        stepId: step.id,
        step: step.type,
        status: 'completed',
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        error: null,
        timestamp: Date.now(),
      });
    }

    // Mark as completed with demo data
    await new Promise(resolve => setTimeout(resolve, 500));
    setDemoCompleted({
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      receivingTxHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      receivedAmount: amount,
      autoDepositCompleted: true,
      depositTxHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      finalTradingBalance: amount,
    });
  }, [sourceChain, sourceToken, amount, quote, startDemoExecution, updateDemoStep, setDemoCompleted]);

  // Get tooltip message for disabled bridge button
  const getTooltipMessage = useCallback((): string => {
    if (!isConnected) return 'Connect your wallet to bridge';
    if (needsSwitch) return 'Switch to the correct network first';
    if (!sourceChain) return 'Select a source chain';
    if (isLoadingTokens) return 'Loading available tokens...';
    if (!sourceToken) return 'No bridgeable tokens available for this chain';
    if (!amount) return 'Enter an amount to bridge';
    if (isQuoteLoading) return 'Fetching quote...';
    if (quoteError) return 'Failed to get quote - try again';
    if (quote && !isBalanceValid) return 'Insufficient balance for this transaction';
    if (isExecuting) return 'Transaction in progress';
    return '';
  }, [isConnected, needsSwitch, sourceChain, sourceToken, amount, quote, isBalanceValid, isExecuting, isLoadingTokens, isQuoteLoading, quoteError]);

  // Determine if bridge button should be disabled
  const hasBalanceIssue = Boolean(quote && !isBalanceValid);

  // In simulate mode, button is enabled when we have valid form data (chain, token, amount)
  // In bridge mode, we need wallet connected and balance validation
  const isSimulateButtonDisabled = !sourceChain || !sourceToken || isLoadingTokens || !amount;
  const isBridgeButtonDisabled = !isConnected || !sourceChain || needsSwitch || !sourceToken || isLoadingTokens || !amount || isSwitchPending || hasBalanceIssue || isExecuting || !quote;

  const isBridgeDisabled = isSimulateMode ? isSimulateButtonDisabled : isBridgeButtonDisabled;

  return (
    <Card className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Bridge Assets</CardTitle>
          {/* Settings and Refresh buttons */}
          <div className="flex items-center gap-1">
            <SettingsPanel onSettingsChange={refetchQuote} />
            <button
              onClick={refreshChains}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors',
                isLoading && 'animate-spin'
              )}
              title="Refresh chains"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Bridge/Simulate Mode Toggle */}
        <BridgeModeToggle />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Switch Prompt - Only shown in Bridge mode (not Simulate) */}
        {!isSimulateMode && showNetworkPrompt && (
          <NetworkSwitchPrompt
            targetChain={targetChain}
            onDismiss={handlePromptDismiss}
            onSuccess={handleSwitchSuccess}
            variant="banner"
          />
        )}

        {/* Dismissed prompt warning - Only in Bridge mode */}
        {!isSimulateMode && targetChain && isDismissed && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated border border-border-subtle">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-caption text-text-muted">
              Network switch required to bridge
            </span>
            <button
              onClick={() => setIsDismissed(false)}
              className="ml-auto text-caption text-accent-primary hover:underline"
            >
              Switch
            </button>
          </div>
        )}

        {/* Main Bridge Layout - Horizontal on md+, Vertical on mobile */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 lg:gap-6">
          {/* From Section - Left side on desktop */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <label className="text-small text-text-secondary">From</label>
              <ChainSelector
                value={sourceChain}
                onChange={handleChainChange}
                chains={chains}
                isLoading={isLoading}
                error={error}
                disabled={false}
                placeholder="Select source chain"
                onRetry={refreshChains}
                failureCount={failureCount}
                maxRetries={maxRetries}
              />
            </div>

            {/* ERR-001: Token Load Error Display */}
            {tokenLoadError && sourceChain && (
              <TokenLoadError
                onRetry={handleRetryTokenLoad}
                isRetrying={isRetryingTokens}
              />
            )}

            {/* Amount Input with Token Selector */}
            <div className="space-y-2">
              <label className="text-small text-text-secondary">Amount</label>
              <div className="relative flex items-center gap-2">
                <Input
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={!sourceChain || (!isSimulateMode && needsSwitch) || !sourceToken}
                  className="flex-1"
                  aria-label="Bridge amount"
                />
                <TokenSelector
                  value={sourceToken}
                  onChange={handleTokenChange}
                  tokens={availableTokens}
                  isLoading={isLoadingTokens}
                  disabled={!sourceChain || (!isSimulateMode && needsSwitch)}
                  placeholder="Token"
                />
              </div>
              {/* QUOTE-001: Amount Validation Warning */}
              {!amountValidation.isValid && (
                <AmountValidationWarning validation={amountValidation} />
              )}
            </div>
          </div>

          {/* Arrow Divider - Center on desktop */}
          <div className="flex justify-center py-3 md:py-0 md:px-2">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-muted/20 border-2 border-accent-primary/30 flex items-center justify-center shadow-lg shadow-accent-primary/10">
              {/* ArrowDown on mobile, ArrowRight on desktop */}
              <ArrowDown className="w-5 h-5 md:hidden text-accent-primary" />
              <ArrowRight className="hidden md:block w-6 h-6 text-accent-primary" />
            </div>
          </div>

          {/* To Section - Right side on desktop */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <label className="text-small text-text-secondary">To</label>
              <DestinationChainDisplay />
            </div>

            {/* Quote Display - Desktop only in this position */}
            <div className="hidden md:block">
              <QuoteDisplay
                quote={quote}
                isLoading={isQuoteLoading}
                error={quoteError}
              />
            </div>
          </div>
        </div>

        {/* Quote Display - Mobile only */}
        <div className="md:hidden">
          <QuoteDisplay
            quote={quote}
            isLoading={isQuoteLoading}
            error={quoteError}
          />
        </div>

        {/* QUOTE-002: Exchange Rate Display */}
        {quote && <ExchangeRateDisplay quote={quote} className="mt-2" />}

        {/* QUOTE-003: Alternative Routes Display */}
        {quote && <AlternativeRoutesDisplay quote={quote} />}

        {/* Balance Warnings - Only shown in Bridge mode */}
        {!isSimulateMode && quote && warnings.length > 0 && (
          <BalanceWarning warnings={warnings} />
        )}

        {/* Auto-Deposit Toggle */}
        {quote && (
          <AutoDepositToggle
            enabled={autoDepositEnabled}
            onToggle={handleAutoDepositToggle}
            includesAutoDeposit={quote.includesAutoDeposit}
          />
        )}

        {/* Bridge Button with Tooltip */}
        <BridgeButtonTooltip
          show={Boolean(!isSimulateMode && isBridgeDisabled && isConnected && !isExecuting)}
          message={getTooltipMessage()}
        >
          <Button
            className="w-full hover:shadow-glow"
            size="lg"
            disabled={isBridgeDisabled}
            onClick={isSimulateMode ? () => openWalletModal() : handleBridge}
          >
            {isSimulateMode
              ? !sourceChain
                ? 'Select Chain'
                : !sourceToken
                ? 'Select Token'
                : !amount
                ? 'Enter Amount'
                : isQuoteLoading
                ? 'Getting Quote...'
                : 'Connect to Bridge'
              : !isConnected
              ? 'Connect Wallet'
              : isExecuting
              ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bridging...
                </>
              )
              : isSwitchPending
              ? 'Switching Network...'
              : needsSwitch
              ? 'Switch Network First'
              : !sourceChain
              ? 'Select Chain'
              : !amount
              ? 'Enter Amount'
              : isQuoteLoading
              ? 'Getting Quote...'
              : !quote
              ? 'Get Quote'
              : hasBalanceIssue
              ? 'Insufficient Balance'
              : 'Bridge Now'}
          </Button>
        </BridgeButtonTooltip>

        {/* Demo Options - Only in Simulate mode when quote is ready */}
        {isSimulateMode && quote && (
          <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-card space-y-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-accent-primary" />
              <span className="text-small font-medium text-text-primary">Demo Mode</span>
            </div>
            <p className="text-caption text-text-muted">
              Preview the full experience without connecting a wallet or having funds.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleDemoPreview}
              >
                <Play className="w-4 h-4 mr-1" />
                Preview Bridge
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleDemoTrading}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Demo Trading
              </Button>
            </div>
          </div>
        )}

        {/* Info Text */}
        {sourceChain && (isSimulateMode || (isConnected && !needsSwitch)) && (
          <p className="text-center text-caption text-text-muted">
            {isSimulateMode ? 'Simulating bridge' : 'Bridging'} from {sourceChain.name} to HyperEVM
          </p>
        )}

        {/* Network mismatch warning when dismissed - Bridge mode only */}
        {!isSimulateMode && isConnected && needsSwitch && isDismissed && (
          <p className="text-center text-caption text-warning">
            Switch to {sourceChain?.name} to continue
          </p>
        )}
      </CardContent>

      {/* Execution Modal */}
      <ExecutionModal
        onBridgeAgain={handleBridgeAgain}
        onStartOver={handleStartOver}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    </Card>
  );
}

export default BridgeForm;
