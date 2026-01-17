'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Copy, Check, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils/share';

// Helper to truncate address
const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

// WALLET-003: Keys to clean up on disconnect
const WALLET_STORAGE_KEYS_TO_CLEAN = [
  'wagmi.store',
  'wagmi.cache',
  'wagmi.connected',
  'wagmi.wallet',
  'wagmi.recentConnectorId',
  'wc@2',
  '@w3m',
  'appkit',
];

interface ConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectButton({
  className,
  size = 'sm',
  variant = 'secondary',
  onConnect,
  onDisconnect,
}: ConnectButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected, caipAddress } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  // Issue 3 Fix: Get current chain for dynamic explorer URL
  const { chain } = useAccount();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // WALLET-002: Track hydration state to prevent loading flash
  const [isHydrated, setIsHydrated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Issue 4 Fix: Track previous connection state to prevent multiple onConnect fires
  const wasConnectedRef = useRef(false);

  // WALLET-002: Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Issue 4 Fix: Handle connection change - only fire onConnect on actual new connection
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current && onConnect) {
      onConnect();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected, onConnect]);

  const handleConnect = useCallback(() => {
    open();
  }, [open]);

  const handleCopyAddress = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!address) return;

    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleDisconnect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // WALLET-003: Comprehensive localStorage cleanup on disconnect
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Check for balance/token data
          if (key.includes('balance') || key.includes('token')) {
            keysToRemove.push(key);
          }
          // Check for wallet connection related keys
          for (const walletKey of WALLET_STORAGE_KEYS_TO_CLEAN) {
            if (key.startsWith(walletKey) || key.includes(walletKey)) {
              keysToRemove.push(key);
              break;
            }
          }
        }
      }
      // Remove all identified keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Also clear sessionStorage for wallet-related data
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          for (const walletKey of WALLET_STORAGE_KEYS_TO_CLEAN) {
            if (key.startsWith(walletKey) || key.includes(walletKey)) {
              sessionKeysToRemove.push(key);
              break;
            }
          }
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (err) {
      // localStorage/sessionStorage might not be available
      console.warn('Failed to clean up wallet storage:', err);
    }

    disconnect();
    setIsDropdownOpen(false);
    onDisconnect?.();
  }, [disconnect, onDisconnect]);


  // Size variants for the button
  const sizeClasses = {
    sm: 'h-10 px-4 py-2.5 text-caption',
    md: 'h-11 px-5 py-3 text-small',
    lg: 'h-14 px-6 py-3.5 text-body',
  };

  // Style variants
  const variantClasses = {
    primary: 'bg-gradient-to-b from-accent-primary to-accent-muted text-bg-base border-t border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.1),0_0_20px_rgba(125,211,252,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1),0_0_30px_rgba(125,211,252,0.5)] active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
    secondary: 'bg-bg-base/70 backdrop-blur-3xl backdrop-saturate-150 text-text-primary border border-border-default/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-bg-surface/60 hover:border-accent-primary/50 hover:shadow-[0_0_15px_rgba(125,211,252,0.15)]',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  };

  // WALLET-002: Show skeleton during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-card font-medium animate-pulse',
          sizeClasses[size],
          'bg-bg-surface/50 border border-border-default/20',
          className
        )}
      >
        {/* Skeleton avatar */}
        <div className="w-5 h-5 rounded-full bg-bg-elevated" />
        {/* Skeleton text */}
        <div className="w-24 h-4 rounded bg-bg-elevated" />
      </div>
    );
  }

  // Connected state button
  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Connected Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
            sizeClasses[size],
            variantClasses[variant],
            isDropdownOpen && 'border-accent-primary/50',
            className
          )}
        >
          {/* Wallet Avatar/Icon */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center">
            <span className="text-[10px] font-bold text-bg-base">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>

          {/* Truncated Address */}
          <span className="font-mono">{truncateAddress(address)}</span>

          {/* Dropdown Indicator */}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-muted transition-transform duration-standard',
              isDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-bg-elevated border border-border-default rounded-card shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Full Address Section */}
            <div className="p-4 border-b border-border-subtle">
              <p className="text-caption text-text-muted mb-2">Connected Wallet</p>
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bg-base">
                    {address.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                {/* Address */}
                <div className="flex-1 min-w-0">
                  <p className="text-small text-text-primary font-mono truncate">
                    {address}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              {/* Copy Address */}
              <button
                type="button"
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors duration-micro"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-small">
                  {copied ? 'Copied!' : 'Copy Address'}
                </span>
              </button>

              {/* View on Explorer */}
              <a
                href={`${chain?.blockExplorers?.default?.url || 'https://etherscan.io'}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors duration-micro"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-small">View on Explorer</span>
              </a>

              {/* Divider */}
              <div className="my-2 border-t border-border-subtle" />

              {/* Disconnect */}
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-colors duration-micro"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-small">Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Disconnected state - Connect button with shimmer effect
  return (
    <button
      onClick={handleConnect}
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': '#7DD3FC',
          '--radius': '12px',
          '--speed': '3s',
          '--cut': '0.05em',
          '--bg': '#18181B',
        } as React.CSSProperties
      }
      className={cn(
        'group relative z-0 inline-flex items-center justify-center gap-2 overflow-hidden rounded-card font-medium transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base active:scale-[0.98]',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {/* Shimmer border effect */}
      <div className="-z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]">
        <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </div>
      </div>

      {/* Backdrop to cover shimmer inside button */}
      <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />

      <HugeiconsIcon icon={Wallet01Icon} size={16} />
      <span>Connect Wallet</span>
    </button>
  );
}

// Export utility for use elsewhere
export { truncateAddress };
