'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, ArrowDown, RefreshCw, Info, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useChainId } from 'wagmi';
import { useShallow } from 'zustand/react/shallow';
import { ChainSelector } from './chain-selector';
import { TokenSelector } from './token-selector';
import { QuoteDisplay } from './quote-display';
import { BalanceWarning } from './balance-warning';
import { AutoDepositToggle } from './auto-deposit-toggle';
import { ExecutionModal } from './execution-modal';
import { SettingsPanel } from './settings-panel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkSwitchPrompt } from '@/components/wallet';
import { useChains, useNetworkSwitchNeeded, useNetworkSwitch, useWalletBalance, useBridgeQuote, useBalanceValidation, useBridgeExecution, useTransactionHistory } from '@/lib/hooks';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-lg shadow-lg z-10 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-warning" />
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
function ExchangeRateDisplay({ quote }: { quote: Quote }) {
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
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface/50 border border-border-subtle">
      <span className="text-caption text-text-muted">Exchange Rate</span>
      <span className="text-small text-text-secondary font-medium">
        1 {quote.fromToken.symbol} ≈ {rate} {quote.toToken.symbol}
      </span>
    </div>
  );
}

/**
 * Alternative routes display component (QUOTE-003)
 * Shows alternative routes with trade-offs when available
 */
function AlternativeRoutesDisplay({ quote, className }: { quote: Quote; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we have alternative routes
  if (!quote.alternativeRoutes || quote.alternativeRoutes.length === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes}m`;
  };

  return (
    <div className={cn('border border-border-subtle rounded-xl overflow-hidden', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface/50 hover:bg-bg-elevated/50 transition-colors"
      >
        <span className="text-small text-text-secondary flex items-center gap-2">
          <Info className="w-4 h-4" />
          {quote.alternativeRoutes.length} alternative route{quote.alternativeRoutes.length > 1 ? 's' : ''} available
        </span>
        <span className={cn('text-text-muted transition-transform text-caption', isExpanded && 'rotate-180')}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-border-subtle bg-bg-base/50">
          <p className="text-caption text-text-muted mb-2">
            Current route: <span className="text-text-secondary font-medium">{quote.routePreference}</span> (selected)
          </p>
          {quote.alternativeRoutes.map((route) => (
            <div
              key={route.routeId}
              className="flex items-center justify-between p-2 rounded-lg bg-bg-surface/30 border border-border-subtle"
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-caption font-medium',
                  route.type === 'fastest' && 'bg-success/10 text-success',
                  route.type === 'cheapest' && 'bg-accent-primary/10 text-accent-primary',
                  route.type === 'recommended' && 'bg-warning/10 text-warning'
                )}>
                  {route.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-caption text-text-muted">
                <span>{formatTime(route.estimatedTime)}</span>
                <span>${parseFloat(route.totalFees).toFixed(2)} fees</span>
              </div>
            </div>
          ))}
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
  const { sourceChain, sourceToken, amount, setSourceChain, setSourceToken, setAmount } = useBridgeStore(
    useShallow((state) => ({
      sourceChain: state.sourceChain,
      sourceToken: state.sourceToken,
      amount: state.amount,
      setSourceChain: state.setSourceChain,
      setSourceToken: state.setSourceToken,
      setAmount: state.setAmount,
    }))
  );

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

    // Check minimum amount
    if (tokenPrice > 0 && usdValue < MIN_BRIDGE_AMOUNT_USD) {
      return {
        isValid: false,
        message: `Minimum bridge amount is $${MIN_BRIDGE_AMOUNT_USD}. Current value: $${usdValue.toFixed(2)}`,
        severity: 'warning',
      };
    }

    // Check maximum amount (safety limit)
    if (tokenPrice > 0 && usdValue > MAX_BRIDGE_AMOUNT_USD) {
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
  const isBridgeDisabled = !isConnected || !sourceChain || needsSwitch || !sourceToken || isLoadingTokens || !amount || isSwitchPending || hasBalanceIssue || isExecuting || !quote;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Switch Prompt - Enhanced with current vs target chain display */}
        {showNetworkPrompt && (
          <NetworkSwitchPrompt
            targetChain={targetChain}
            onDismiss={handlePromptDismiss}
            onSuccess={handleSwitchSuccess}
            variant="banner"
          />
        )}

        {/* Dismissed prompt warning (shows inline if user dismissed) */}
        {targetChain && isDismissed && (
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

        {/* From Section */}
        <div className="space-y-2">
          <label className="text-small text-text-secondary">From</label>
          <ChainSelector
            value={sourceChain}
            onChange={handleChainChange}
            chains={chains}
            isLoading={isLoading}
            error={error}
            disabled={!isConnected}
            placeholder={isConnected ? 'Select source chain' : 'Connect wallet first'}
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
              disabled={!sourceChain || needsSwitch || !sourceToken}
              className="flex-1"
              aria-label="Bridge amount"
            />
            <TokenSelector
              value={sourceToken}
              onChange={handleTokenChange}
              tokens={availableTokens}
              isLoading={isLoadingTokens}
              disabled={!sourceChain || needsSwitch}
              placeholder="Token"
            />
          </div>
          {/* QUOTE-001: Amount Validation Warning */}
          {!amountValidation.isValid && (
            <AmountValidationWarning validation={amountValidation} />
          )}
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center">
            <ArrowDown className="w-5 h-5 text-text-muted" />
          </div>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <label className="text-small text-text-secondary">To</label>
          <DestinationChainDisplay />
        </div>

        {/* Quote Display */}
        <QuoteDisplay
          quote={quote}
          isLoading={isQuoteLoading}
          error={quoteError}
        />

        {/* QUOTE-002: Exchange Rate Display */}
        {quote && <ExchangeRateDisplay quote={quote} />}

        {/* QUOTE-003: Alternative Routes Display */}
        {quote && <AlternativeRoutesDisplay quote={quote} />}

        {/* Balance Warnings */}
        {quote && warnings.length > 0 && (
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
          show={Boolean(isBridgeDisabled && isConnected && !isExecuting)}
          message={getTooltipMessage()}
        >
          <Button
            className="w-full hover:shadow-glow"
            size="lg"
            disabled={isBridgeDisabled}
            onClick={handleBridge}
          >
            {!isConnected
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

        {/* Info Text */}
        {isConnected && sourceChain && !needsSwitch && (
          <p className="text-center text-caption text-text-muted">
            Bridging from {sourceChain.name} to HyperEVM
          </p>
        )}

        {/* Network mismatch warning when dismissed */}
        {isConnected && needsSwitch && isDismissed && (
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
