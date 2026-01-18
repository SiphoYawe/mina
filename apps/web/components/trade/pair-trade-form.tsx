'use client';

import { useState, useCallback } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { usePearMarkets, usePairTrade, usePearAuth } from '@/lib/pear';
import { useBridgeMode } from '@/lib/stores/bridge-store';
import { cn } from '@/lib/utils';

interface PairTradeFormProps {
  className?: string;
}

export function PairTradeForm({ className }: PairTradeFormProps) {
  const { isAuthenticated, authenticate, isAuthenticating } = usePearAuth();
  const { data: marketsData, isLoading: marketsLoading } = usePearMarkets({ pageSize: 20 });
  const { executePairTrade, isLoading: isTrading } = usePairTrade();
  const bridgeMode = useBridgeMode();
  const isSimulateMode = bridgeMode === 'simulate';
  const toast = useToast();

  // Form state
  const [longAsset, setLongAsset] = useState('BTC');
  const [shortAsset, setShortAsset] = useState('ETH');
  const [usdValue, setUsdValue] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Popular pairs for quick selection
  const popularPairs = [
    { long: 'BTC', short: 'ETH', label: 'BTC/ETH' },
    { long: 'SOL', short: 'ETH', label: 'SOL/ETH' },
    { long: 'BTC', short: 'SOL', label: 'BTC/SOL' },
    { long: 'DOGE', short: 'SHIB', label: 'DOGE/SHIB' },
  ];

  const handleTradeClick = () => {
    if (!usdValue || isNaN(Number(usdValue)) || Number(usdValue) <= 0) {
      toast.error('Invalid amount', 'Please enter a valid USD amount');
      return;
    }
    if (isSimulateMode) {
      // In simulation mode, show success toast immediately
      toast.success(
        'Simulation executed',
        `${longAsset}/${shortAsset} pair trade simulated with $${usdValue} at ${leverage}x leverage`
      );
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmTrade = useCallback(async () => {
    const toastId = toast.loading('Executing trade...', `Opening ${longAsset}/${shortAsset} position`);

    try {
      await executePairTrade({
        longAsset,
        shortAsset,
        usdValue: Number(usdValue),
        leverage,
      });
      toast.update(toastId, {
        type: 'success',
        title: 'Trade executed!',
        description: `Successfully opened ${longAsset}/${shortAsset} position with $${usdValue} at ${leverage}x`,
      });
      // Reset form
      setUsdValue('');
      setLeverage(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.update(toastId, {
        type: 'error',
        title: 'Trade failed',
        description: errorMessage,
      });
    } finally {
      setShowConfirmDialog(false);
    }
  }, [executePairTrade, longAsset, shortAsset, usdValue, leverage, toast]);

  // In simulation mode, bypass authentication requirement
  if (!isAuthenticated && !isSimulateMode) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-h3 text-text-primary mb-2">Sign in to Trade</h3>
          <p className="text-body text-text-muted mb-6 max-w-sm mx-auto">
            Connect your wallet and sign to enable pair trading on Hyperliquid via Pear Protocol.
          </p>
          <Button onClick={authenticate} disabled={isAuthenticating}>
            {isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              'Enable Trading'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="py-6">
        <div className="space-y-6">
          {/* Popular Pairs */}
          <div>
            <label className="text-caption text-text-muted block mb-2">Popular Pairs</label>
            <div className="flex flex-wrap gap-2">
              {popularPairs.map((pair) => (
                <button
                  key={pair.label}
                  onClick={() => {
                    setLongAsset(pair.long);
                    setShortAsset(pair.short);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-small border transition-all',
                    longAsset === pair.long && shortAsset === pair.short
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary'
                  )}
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Selection - MOBILE-002 Fix: Better mobile layout */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 sm:gap-4 items-center">
            {/* Long Asset */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-caption text-text-muted flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="hidden xs:inline">Long</span>
              </label>
              <div className="relative">
                <select
                  value={longAsset}
                  onChange={(e) => setLongAsset(e.target.value)}
                  className="w-full h-10 sm:h-12 px-2 sm:px-4 bg-bg-elevated border border-border-subtle rounded-card text-text-primary text-sm sm:text-base appearance-none focus:border-accent-primary focus:outline-none"
                >
                  {['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'LINK', 'UNI', 'AAVE', 'ARB', 'OP'].map((asset) => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Icon */}
            <div className="pt-5 sm:pt-6">
              <button
                onClick={() => {
                  const temp = longAsset;
                  setLongAsset(shortAsset);
                  setShortAsset(temp);
                }}
                className="p-1.5 sm:p-2 rounded-full bg-bg-elevated border border-border-subtle hover:border-accent-primary transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />
              </button>
            </div>

            {/* Short Asset */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-caption text-text-muted flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-error" />
                <span className="hidden xs:inline">Short</span>
              </label>
              <div className="relative">
                <select
                  value={shortAsset}
                  onChange={(e) => setShortAsset(e.target.value)}
                  className="w-full h-10 sm:h-12 px-2 sm:px-4 bg-bg-elevated border border-border-subtle rounded-card text-text-primary text-sm sm:text-base appearance-none focus:border-accent-primary focus:outline-none"
                >
                  {['ETH', 'BTC', 'SOL', 'DOGE', 'AVAX', 'LINK', 'UNI', 'AAVE', 'ARB', 'OP'].map((asset) => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-caption text-text-muted">Trade Size (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                type="number"
                value={usdValue}
                onChange={(e) => setUsdValue(e.target.value)}
                placeholder="0.00"
                className="pl-8 h-12 text-body font-mono"
              />
            </div>
            {/* MOBILE-003 Fix: Better button sizing on mobile */}
            <div className="flex gap-1.5 sm:gap-2">
              {[100, 500, 1000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setUsdValue(String(amount))}
                  className="flex-1 py-1 sm:py-1.5 text-[11px] sm:text-caption text-text-muted bg-bg-elevated rounded border border-border-subtle hover:border-border-default transition-colors"
                >
                  ${amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-caption text-text-muted">Leverage</label>
              <span className="text-caption text-text-primary font-mono">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-caption text-text-muted">
              <span>1x</span>
              <span>10x</span>
              <span>20x</span>
            </div>
          </div>

          {/* Trade Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleTradeClick}
            disabled={isTrading || !usdValue || Number(usdValue) <= 0}
          >
            {isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing Trade...
              </>
            ) : isSimulateMode ? (
              <>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Simulate {longAsset}/{shortAsset} Position
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Open {longAsset}/{shortAsset} Position
              </>
            )}
          </Button>

          {/* Info */}
          <p className="text-caption text-text-muted text-center">
            {isSimulateMode && <span className="text-accent-primary">[Simulation] </span>}
            Going long {longAsset} / short {shortAsset} with {leverage}x leverage
          </p>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmTrade}
        title="Confirm Pair Trade"
        description={`You are about to open a ${longAsset}/${shortAsset} pair position.`}
        confirmText="Execute Trade"
        cancelText="Cancel"
        variant="default"
        isLoading={isTrading}
        details={[
          { label: 'Long', value: longAsset },
          { label: 'Short', value: shortAsset },
          { label: 'Size', value: `$${Number(usdValue).toLocaleString()}` },
          { label: 'Leverage', value: `${leverage}x` },
        ]}
      />
    </Card>
  );
}
