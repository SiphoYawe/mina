'use client';

import React, { useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBridgeStore, type BridgeMode } from '@/lib/stores/bridge-store';
import { cn } from '@/lib/utils';

/**
 * BridgeModeToggle Component
 *
 * Allows users to switch between "Bridge" and "Simulate" modes.
 * - Bridge mode: Requires wallet connection, enables actual bridging
 * - Simulate mode: Works without wallet, allows exploring quotes
 *
 * Behavior:
 * - If wallet is connected, default to "Bridge"
 * - If wallet is not connected, default to "Simulate"
 * - Configuration is preserved when switching modes
 */
export function BridgeModeToggle() {
  const { isConnected } = useAppKitAccount();
  const mode = useBridgeStore((state) => state.mode);
  const setMode = useBridgeStore((state) => state.setMode);

  // Auto-switch modes based on wallet connection state
  // Using getState() to avoid race conditions from mode being in deps
  useEffect(() => {
    const currentMode = useBridgeStore.getState().mode;
    if (isConnected && currentMode === 'simulate') {
      setMode('bridge');
    } else if (!isConnected && currentMode === 'bridge') {
      setMode('simulate');
    }
  }, [isConnected, setMode]);

  const handleModeChange = (newMode: BridgeMode) => {
    // Don't allow switching to Bridge mode if not connected
    if (newMode === 'bridge' && !isConnected) {
      return; // Will show visual feedback but not switch
    }
    setMode(newMode);
  };

  return (
    <div className="flex p-1 bg-bg-surface rounded-xl border border-border-subtle" role="tablist" aria-label="Bridge mode selection">
      <ModeTab
        mode="bridge"
        currentMode={mode}
        isDisabled={!isConnected}
        onClick={() => handleModeChange('bridge')}
      />
      <ModeTab
        mode="simulate"
        currentMode={mode}
        onClick={() => handleModeChange('simulate')}
      />
    </div>
  );
}

interface ModeTabProps {
  mode: BridgeMode;
  currentMode: BridgeMode;
  isDisabled?: boolean;
  onClick: () => void;
}

function ModeTab({ mode, currentMode, isDisabled = false, onClick }: ModeTabProps) {
  const isActive = mode === currentMode;
  const label = mode === 'bridge' ? 'Bridge' : 'Simulate';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled && !isActive}
      aria-label={`${label} mode`}
      aria-selected={isActive}
      role="tab"
      className={cn(
        'flex-1 px-4 py-2 text-small font-medium rounded-lg transition-all duration-micro',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        isActive
          ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30 shadow-sm'
          : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50',
        isDisabled && !isActive && 'opacity-50 cursor-not-allowed'
      )}
      title={isDisabled && !isActive ? 'Connect wallet to enable Bridge mode' : undefined}
    >
      {label}
    </button>
  );
}

export default BridgeModeToggle;
