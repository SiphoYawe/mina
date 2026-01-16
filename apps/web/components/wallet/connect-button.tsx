'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Wallet, Copy, Check, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to truncate address
const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Issue 4 Fix: Track previous connection state to prevent multiple onConnect fires
  const wasConnectedRef = useRef(false);

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

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    // Clear any cached balance data from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('balance') || key.includes('token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      // localStorage might not be available
    }

    disconnect();
    setIsDropdownOpen(false);
    onDisconnect?.();
  }, [disconnect, onDisconnect]);

  // Issue 3 Fix: Use chain.blockExplorers?.default?.url for dynamic explorer URL
  const handleViewOnExplorer = useCallback(() => {
    if (!address) return;
    const explorerUrl = chain?.blockExplorers?.default?.url || 'https://etherscan.io';
    window.open(`${explorerUrl}/address/${address}`, '_blank');
    setIsDropdownOpen(false);
  }, [address, chain]);

  // Size variants for the button
  const sizeClasses = {
    sm: 'h-8 px-3 text-caption',
    md: 'h-10 px-4 text-small',
    lg: 'h-12 px-6 text-body',
  };

  // Style variants
  const variantClasses = {
    primary: 'bg-accent-primary text-bg-base hover:bg-accent-hover hover:shadow-glow active:scale-[0.98]',
    secondary: 'bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-surface hover:border-accent-primary/50',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  };

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
              <button
                onClick={handleViewOnExplorer}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors duration-micro"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-small">View on Explorer</span>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-border-subtle" />

              {/* Disconnect */}
              <button
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

  // Disconnected state - Connect button
  return (
    <button
      onClick={handleConnect}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base active:scale-[0.98]',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  );
}

// Export utility for use elsewhere
export { truncateAddress };
