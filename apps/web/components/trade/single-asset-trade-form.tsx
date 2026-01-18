'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Loader2, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { useSingleAssetTrade, usePearAuth } from '@/lib/pear';
import { cn } from '@/lib/utils';

interface SingleAssetTradeFormProps {
  className?: string;
}

const AVAILABLE_ASSETS = ['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'LINK', 'UNI', 'AAVE', 'ARB', 'OP', 'MATIC', 'ATOM', 'XRP', 'ADA', 'DOT'];

export function SingleAssetTradeForm({ className }: SingleAssetTradeFormProps) {
  const { isAuthenticated, authenticate, isAuthenticating } = usePearAuth();
  const { executeSingleTrade, isLoading: isTrading } = useSingleAssetTrade();
  const toast = useToast();

  // Form state
  const [asset, setAsset] = useState('BTC');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [usdValue, setUsdValue] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Stop Loss / Take Profit
  const [enableSL, setEnableSL] = useState(false);
  const [enableTP, setEnableTP] = useState(false);
  const [slPercent, setSlPercent] = useState('5');
  const [tpPercent, setTpPercent] = useState('10');

  const handleTradeClick = () => {
    if (!usdValue || isNaN(Number(usdValue)) || Number(usdValue) <= 0) {
      toast.error('Invalid amount', 'Please enter a valid USD amount');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmTrade = useCallback(async () => {
    const toastId = toast.loading(
      'Opening position...',
      `${direction === 'long' ? 'Long' : 'Short'} ${asset} with $${usdValue}`
    );

    try {
      await executeSingleTrade({
        asset,
        direction,
        usdValue: Number(usdValue),
        leverage,
        stopLoss: enableSL ? { type: 'PERCENTAGE', value: Number(slPercent) } : undefined,
        takeProfit: enableTP ? { type: 'PERCENTAGE', value: Number(tpPercent) } : undefined,
      });
      toast.update(toastId, {
        type: 'success',
        title: 'Position opened!',
        description: `Successfully ${direction === 'long' ? 'longed' : 'shorted'} ${asset} with $${usdValue} at ${leverage}x`,
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
  }, [executeSingleTrade, asset, direction, usdValue, leverage, enableSL, enableTP, slPercent, tpPercent, toast]);

  // Require authentication to trade
  if (!isAuthenticated) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-12 text-center">
          <Coins className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-h3 text-text-primary mb-2">Sign in to Trade</h3>
          <p className="text-body text-text-muted mb-6 max-w-sm mx-auto">
            Open single-asset long or short positions with customizable leverage.
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
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-caption text-text-muted">Asset</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full h-12 px-4 bg-bg-elevated border border-border-subtle rounded-card text-text-primary appearance-none focus:border-accent-primary focus:outline-none"
            >
              {AVAILABLE_ASSETS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <label className="text-caption text-text-muted">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection('long')}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-card border transition-all',
                  direction === 'long'
                    ? 'bg-success/10 border-success text-success'
                    : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-success/50'
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Long
              </button>
              <button
                onClick={() => setDirection('short')}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-card border transition-all',
                  direction === 'short'
                    ? 'bg-error/10 border-error text-error'
                    : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-error/50'
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Short
              </button>
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
            {/* MOBILE-001 Fix: Better button sizing on mobile */}
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
              max="50"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-caption text-text-muted">
              <span>1x</span>
              <span>25x</span>
              <span>50x</span>
            </div>
          </div>

          {/* Stop Loss / Take Profit - MOBILE-002 Fix: Better mobile layout */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSL}
                  onChange={(e) => setEnableSL(e.target.checked)}
                  className="accent-accent-primary w-4 h-4"
                />
                <span className="text-[13px] sm:text-small text-text-muted">Stop Loss</span>
              </label>
              {enableSL && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={slPercent}
                    onChange={(e) => setSlPercent(e.target.value)}
                    className="w-14 sm:w-16 h-8 text-[13px] sm:text-small font-mono px-2"
                    min="1"
                    max="99"
                  />
                  <span className="text-caption text-text-muted">%</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTP}
                  onChange={(e) => setEnableTP(e.target.checked)}
                  className="accent-accent-primary w-4 h-4"
                />
                <span className="text-[13px] sm:text-small text-text-muted">Take Profit</span>
              </label>
              {enableTP && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={tpPercent}
                    onChange={(e) => setTpPercent(e.target.value)}
                    className="w-14 sm:w-16 h-8 text-[13px] sm:text-small font-mono px-2"
                    min="1"
                    max="1000"
                  />
                  <span className="text-caption text-text-muted">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Trade Button */}
          <Button
            className={cn('w-full', direction === 'long' ? '' : 'bg-error hover:bg-error/90')}
            size="lg"
            onClick={handleTradeClick}
            disabled={isTrading || !usdValue || Number(usdValue) <= 0}
          >
            {isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening Position...
              </>
            ) : direction === 'long' ? (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Long {asset}
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 mr-2" />
                Short {asset}
              </>
            )}
          </Button>

          {/* Info */}
          <p className="text-caption text-text-muted text-center">
            {direction === 'long' ? 'Long' : 'Short'} {asset} with {leverage}x leverage
            {enableSL && ` • SL: ${slPercent}%`}
            {enableTP && ` • TP: ${tpPercent}%`}
          </p>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmTrade}
        title={`Confirm ${direction === 'long' ? 'Long' : 'Short'} Position`}
        description={`You are about to ${direction === 'long' ? 'long' : 'short'} ${asset}.`}
        confirmText={direction === 'long' ? 'Go Long' : 'Go Short'}
        cancelText="Cancel"
        variant={direction === 'long' ? 'success' : 'danger'}
        isLoading={isTrading}
        details={[
          { label: 'Asset', value: asset },
          { label: 'Direction', value: direction === 'long' ? 'Long' : 'Short' },
          { label: 'Size', value: `$${Number(usdValue).toLocaleString()}` },
          { label: 'Leverage', value: `${leverage}x` },
          ...(enableSL ? [{ label: 'Stop Loss', value: `${slPercent}%` }] : []),
          ...(enableTP ? [{ label: 'Take Profit', value: `${tpPercent}%` }] : []),
        ]}
      />
    </Card>
  );
}
