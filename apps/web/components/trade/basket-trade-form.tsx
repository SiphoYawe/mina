'use client';

import { useState } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown, Loader2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBasketTrade, usePearAuth } from '@/lib/pear';
import { useBridgeMode } from '@/lib/stores/bridge-store';
import { cn } from '@/lib/utils';

interface BasketTradeFormProps {
  className?: string;
}

interface AssetWeight {
  asset: string;
  weight: number;
}

const AVAILABLE_ASSETS = ['BTC', 'ETH', 'SOL', 'DOGE', 'AVAX', 'LINK', 'UNI', 'AAVE', 'ARB', 'OP', 'MATIC', 'ATOM'];

export function BasketTradeForm({ className }: BasketTradeFormProps) {
  const { isAuthenticated, authenticate, isAuthenticating } = usePearAuth();
  const { executeBasketTrade, isLoading: isTrading } = useBasketTrade();
  const bridgeMode = useBridgeMode();
  const isSimulateMode = bridgeMode === 'simulate';

  // Form state
  const [longAssets, setLongAssets] = useState<AssetWeight[]>([
    { asset: 'BTC', weight: 0.5 },
    { asset: 'ETH', weight: 0.5 },
  ]);
  const [shortAssets, setShortAssets] = useState<AssetWeight[]>([
    { asset: 'SOL', weight: 1 },
  ]);
  const [usdValue, setUsdValue] = useState('');
  const [leverage, setLeverage] = useState(1);

  // Add asset to basket
  const addAsset = (side: 'long' | 'short') => {
    const assets = side === 'long' ? longAssets : shortAssets;
    const setAssets = side === 'long' ? setLongAssets : setShortAssets;
    const usedAssets = [...longAssets, ...shortAssets].map(a => a.asset);
    const available = AVAILABLE_ASSETS.find(a => !usedAssets.includes(a));
    if (available) {
      setAssets([...assets, { asset: available, weight: 0.5 }]);
    }
  };

  // Remove asset from basket
  const removeAsset = (side: 'long' | 'short', index: number) => {
    const assets = side === 'long' ? longAssets : shortAssets;
    const setAssets = side === 'long' ? setLongAssets : setShortAssets;
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  // Update asset
  const updateAsset = (side: 'long' | 'short', index: number, field: 'asset' | 'weight', value: string | number) => {
    const assets = side === 'long' ? longAssets : shortAssets;
    const setAssets = side === 'long' ? setLongAssets : setShortAssets;
    const updated: AssetWeight[] = assets.map((item, i) => {
      if (i !== index) return item;
      if (field === 'asset') {
        return { asset: value as string, weight: item.weight };
      } else {
        return { asset: item.asset, weight: value as number };
      }
    });
    setAssets(updated);
  };

  // Normalize weights
  const normalizeWeights = (side: 'long' | 'short') => {
    const assets = side === 'long' ? longAssets : shortAssets;
    const setAssets = side === 'long' ? setLongAssets : setShortAssets;
    const total = assets.reduce((sum, a) => sum + a.weight, 0);
    if (total > 0) {
      setAssets(assets.map(a => ({ ...a, weight: a.weight / total })));
    }
  };

  const handleTrade = async () => {
    if (!usdValue || isNaN(Number(usdValue))) return;

    try {
      await executeBasketTrade({
        longAssets: longAssets.map(a => ({ asset: a.asset, weight: a.weight })),
        shortAssets: shortAssets.map(a => ({ asset: a.asset, weight: a.weight })),
        usdValue: Number(usdValue),
        leverage,
      });
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  // In simulation mode, bypass authentication requirement
  if (!isAuthenticated && !isSimulateMode) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-h3 text-text-primary mb-2">Sign in to Trade Baskets</h3>
          <p className="text-body text-text-muted mb-6 max-w-sm mx-auto">
            Create custom long/short baskets with multiple assets and custom weights.
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

  const renderAssetList = (assets: AssetWeight[], side: 'long' | 'short') => {
    const usedAssets = [...longAssets, ...shortAssets].map(a => a.asset);
    const Icon = side === 'long' ? TrendingUp : TrendingDown;
    const color = side === 'long' ? 'text-success' : 'text-error';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-caption text-text-muted flex items-center gap-1">
            <Icon className={cn('w-3 h-3', color)} />
            {side === 'long' ? 'Long Basket' : 'Short Basket'}
          </label>
          <button
            onClick={() => normalizeWeights(side)}
            className="text-caption text-accent-primary hover:text-accent-hover transition-colors"
          >
            Normalize
          </button>
        </div>

        {/* MOBILE-002 Fix: Better mobile layout for asset rows */}
        {assets.map((asset, index) => (
          <div key={index} className="flex items-center gap-1.5 sm:gap-2">
            <select
              value={asset.asset}
              onChange={(e) => updateAsset(side, index, 'asset', e.target.value)}
              className="flex-1 min-w-0 h-9 sm:h-10 px-2 sm:px-3 bg-bg-elevated border border-border-subtle rounded-card text-text-primary text-[13px] sm:text-small appearance-none focus:border-accent-primary focus:outline-none"
            >
              {AVAILABLE_ASSETS.filter(a => a === asset.asset || !usedAssets.includes(a)).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <Input
              type="number"
              value={asset.weight}
              onChange={(e) => updateAsset(side, index, 'weight', Number(e.target.value))}
              className="w-16 sm:w-20 h-9 sm:h-10 text-[13px] sm:text-small font-mono px-2"
              step="0.1"
              min="0"
              max="1"
            />
            <button
              onClick={() => removeAsset(side, index)}
              disabled={assets.length <= 1}
              className="p-1.5 sm:p-2 text-text-muted hover:text-error disabled:opacity-30 disabled:hover:text-text-muted transition-colors flex-shrink-0"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => addAsset(side)}
          className="w-full py-2 border border-dashed border-border-subtle rounded-card text-small text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="py-6">
        <div className="space-y-6">
          {/* Baskets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderAssetList(longAssets, 'long')}
            {renderAssetList(shortAssets, 'short')}
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
          </div>

          {/* Trade Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={isSimulateMode ? undefined : handleTrade}
            disabled={isTrading || !usdValue || Number(usdValue) <= 0}
          >
            {isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing Basket Trade...
              </>
            ) : isSimulateMode ? (
              <>
                <Package className="w-4 h-4 mr-2" />
                Simulate Basket Position
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Open Basket Position
              </>
            )}
          </Button>

          {/* Summary - MOBILE-001 Fix: Better text wrapping on mobile */}
          <div className="text-caption text-text-muted text-center space-y-1 px-1">
            {isSimulateMode && <p className="text-accent-primary">[Simulation]</p>}
            <p className="break-words">
              Long: {longAssets.map(a => `${a.asset} (${(a.weight * 100).toFixed(0)}%)`).join(', ')}
            </p>
            <p className="break-words">
              Short: {shortAssets.map(a => `${a.asset} (${(a.weight * 100).toFixed(0)}%)`).join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
