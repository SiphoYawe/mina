'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePearPositions, useClosePosition, usePearAuth, type Position } from '@/lib/pear';
import { useBridgeMode } from '@/lib/stores/bridge-store';
import { cn } from '@/lib/utils';

interface PositionsSidebarProps {
  className?: string;
}

function PositionCard({ position, onClose }: { position: Position; onClose: () => void }) {
  const { mutate: closePosition, isPending } = useClosePosition();
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculate position info
  const isProfit = position.unrealizedPnl >= 0;
  const longAssets = position.longAssets.map(a => a.coin).join(', ') || 'None';
  const shortAssets = position.shortAssets.map(a => a.coin).join(', ') || 'None';

  const handleClose = () => {
    closePosition({
      positionId: position.positionId,
      request: { executionType: 'MARKET' },
    }, {
      onSuccess: () => {
        setShowConfirm(false);
        onClose();
      },
    });
  };

  return (
    <div className="bg-bg-elevated rounded-card p-4 border border-border-subtle">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-small text-text-primary">{longAssets}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3 h-3 text-error" />
            <span className="text-small text-text-primary">{shortAssets}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-body font-mono',
            isProfit ? 'text-success' : 'text-error'
          )}>
            {isProfit ? '+' : ''}{position.unrealizedPnl.toFixed(2)}
          </p>
          <p className={cn(
            'text-caption',
            isProfit ? 'text-success' : 'text-error'
          )}>
            {isProfit ? '+' : ''}{position.unrealizedPnlPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-caption">
        <div>
          <p className="text-text-muted">Size</p>
          <p className="text-text-primary font-mono">${position.positionValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-text-muted">Margin</p>
          <p className="text-text-primary font-mono">${position.marginUsed.toFixed(2)}</p>
        </div>
      </div>

      {/* Risk Parameters */}
      {(position.stopLoss || position.takeProfit) && (
        <div className="flex gap-2 mb-3">
          {position.stopLoss && (
            <span className="px-2 py-0.5 bg-error/10 text-error text-caption rounded">
              SL: {position.stopLoss.value}{position.stopLoss.type === 'PERCENTAGE' ? '%' : ''}
            </span>
          )}
          {position.takeProfit && (
            <span className="px-2 py-0.5 bg-success/10 text-success text-caption rounded">
              TP: {position.takeProfit.value}{position.takeProfit.type === 'PERCENTAGE' ? '%' : ''}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showConfirm ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={handleClose}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Confirm Close'
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => setShowConfirm(true)}
        >
          <X className="w-3 h-3 mr-1" />
          Close Position
        </Button>
      )}
    </div>
  );
}

export function PositionsSidebar({ className }: PositionsSidebarProps) {
  const { isAuthenticated } = usePearAuth();
  const { data: positions, isLoading, error, refetch } = usePearPositions();
  const bridgeMode = useBridgeMode();
  const isSimulateMode = bridgeMode === 'simulate';

  // In simulation mode, show empty positions state instead of auth prompt
  if (!isAuthenticated && !isSimulateMode) {
    return (
      <div className={cn('bg-bg-surface rounded-card p-4', className)}>
        <h3 className="text-body font-semibold text-text-primary mb-4">Open Positions</h3>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-text-muted" />
          <p className="text-small text-text-muted">
            Sign in to view positions
          </p>
        </div>
      </div>
    );
  }

  // In simulation mode without auth, show simulated empty state
  if (!isAuthenticated && isSimulateMode) {
    return (
      <div className={cn('bg-bg-surface rounded-card p-4', className)}>
        <h3 className="text-body font-semibold text-text-primary mb-4">
          Open Positions <span className="text-accent-primary text-caption">[Simulation]</span>
        </h3>
        <div className="text-center py-8">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-text-muted" />
          <p className="text-small text-text-muted">No simulated positions</p>
          <p className="text-caption text-text-muted mt-1">
            Positions will appear here in simulation mode
          </p>
        </div>
      </div>
    );
  }

  // Don't show anything if no positions (hide empty state)
  if (!isLoading && !error && (!positions || positions.length === 0)) {
    return null;
  }

  return (
    <div className={cn('bg-bg-surface rounded-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-semibold text-text-primary">Open Positions</h3>
        {positions && positions.length > 0 && (
          <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-caption rounded-full">
            {positions.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-error" />
          <p className="text-small text-text-muted mb-2">Failed to load positions</p>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : positions ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {positions.map((position) => (
            <PositionCard
              key={position.positionId}
              position={position}
              onClose={() => refetch()}
            />
          ))}
        </div>
      ) : null}

      {/* Link to Hyperliquid */}
      <a
        href="https://app.hyperliquid.xyz/trade"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between mt-4 p-3 bg-bg-elevated rounded-card text-small text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
      >
        <span>View on Hyperliquid</span>
        <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  );
}
