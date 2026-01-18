'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, ChevronDown, X, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Chain } from '@siphoyawe/mina-sdk';
import { cn } from '@/lib/utils';

/**
 * Popular chains to show first in the list
 * Based on user activity and trading volume
 */
const POPULAR_CHAIN_KEYS = ['eth', 'arb', 'bas', 'pol', 'opt', 'bsc', 'ava'];

interface ChainSelectorProps {
  /** Currently selected chain */
  value: Chain | null;
  /** Callback when chain is selected */
  onChange: (chain: Chain) => void;
  /** List of available chains */
  chains: Chain[];
  /** User's total balance per chain (chainId -> formatted balance string) */
  balances?: Record<number, string>;
  /** Loading state for chains */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback for retrying chain fetch */
  onRetry?: () => void;
  /** Current retry attempt count */
  failureCount?: number;
  /** Maximum number of retries */
  maxRetries?: number;
}

/**
 * Chain icon component with fallback
 * Issue 8 fix: Reset hasError when chain.id changes
 */
function ChainIcon({ chain, size = 'md' }: { chain: Chain; size?: 'sm' | 'md' | 'lg' }) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when chain changes
  useEffect(() => {
    setHasError(false);
  }, [chain.id]);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  if (hasError || !chain.logoUrl) {
    // Fallback: First letter of chain name with gradient background
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0'
        )}
      >
        <span className="text-bg-base font-semibold text-caption">
          {chain.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={chain.logoUrl}
      alt={`${chain.name} logo`}
      className={cn(sizeClasses[size], 'rounded-full flex-shrink-0 object-contain')}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Issue 1 fix: Pure function without useCallback - no dependencies needed
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="text-accent-primary font-medium">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * Single chain option in the dropdown list
 * Issue 4 fix: Wrapped with React.memo to prevent re-renders on every keystroke
 */
const ChainOption = memo(function ChainOption({
  chain,
  balance,
  isSelected,
  searchQuery,
  onClick,
  isFocused,
}: {
  chain: Chain;
  balance?: string;
  isSelected: boolean;
  searchQuery: string;
  onClick: () => void;
  isFocused?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={cn(
        // MOBILE-008 Fix: Increased touch target height for mobile accessibility
        'w-full flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg transition-all duration-micro',
        'hover:bg-bg-elevated focus:bg-bg-elevated focus:outline-none',
        // MOBILE-008 Fix: Added touch feedback
        'active:scale-[0.99] active:bg-bg-elevated',
        isSelected && 'bg-accent-primary/10 border border-accent-primary/30',
        isFocused && 'bg-bg-elevated ring-2 ring-accent-primary/50'
      )}
    >
      <ChainIcon chain={chain} size="md" />

      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          'text-small font-medium truncate',
          isSelected ? 'text-accent-primary' : 'text-text-primary'
        )}>
          {highlightMatch(chain.name, searchQuery)}
        </p>
        {balance && (
          <p className="text-caption text-text-muted truncate">
            ${balance}
          </p>
        )}
      </div>

      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0" />
      )}
    </button>
  );
});

/**
 * Chain Selector Component
 *
 * Displays a dropdown for selecting the source chain in bridge transactions.
 * Features:
 * - Searchable chain list
 * - Popular chains shown first
 * - Chain icons and balances
 * - Keyboard navigation support
 */
export function ChainSelector({
  value,
  onChange,
  chains,
  balances = {},
  isLoading = false,
  error = null,
  disabled = false,
  placeholder = 'Select chain',
  className,
  onRetry,
  failureCount = 0,
  maxRetries = 3,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Issue 5 fix: Add focusedIndex for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens and reset focusedIndex
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Sort and filter chains - moved before keyboard handler that uses it
  const sortedAndFilteredChains = useMemo(() => {
    // Filter by search
    let filtered = chains;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = chains.filter(
        (chain) =>
          chain.name.toLowerCase().includes(searchLower) ||
          chain.key.toLowerCase().includes(searchLower)
      );
    }

    // Sort: popular chains first, then alphabetically
    return [...filtered].sort((a, b) => {
      const aIsPopular = POPULAR_CHAIN_KEYS.includes(a.key);
      const bIsPopular = POPULAR_CHAIN_KEYS.includes(b.key);

      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      if (aIsPopular && bIsPopular) {
        return POPULAR_CHAIN_KEYS.indexOf(a.key) - POPULAR_CHAIN_KEYS.indexOf(b.key);
      }
      return a.name.localeCompare(b.name);
    });
  }, [chains, search]);

  // Handle chain selection
  const handleSelect = useCallback((chain: Chain) => {
    onChange(chain);
    setIsOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  }, [onChange]);

  // Issue 5 fix: Handle keyboard navigation with Arrow keys and Enter
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setSearch('');
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const maxIndex = sortedAndFilteredChains.length - 1;
            return prev < maxIndex ? prev + 1 : 0;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const maxIndex = sortedAndFilteredChains.length - 1;
            return prev > 0 ? prev - 1 : maxIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < sortedAndFilteredChains.length) {
            const selectedChain = sortedAndFilteredChains[focusedIndex];
            if (selectedChain) {
              handleSelect(selectedChain);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, sortedAndFilteredChains, handleSelect]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (!disabled && !isLoading) {
      setIsOpen((prev) => !prev);
      if (isOpen) {
        setSearch('');
      }
    }
  }, [disabled, isLoading, isOpen]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled || isLoading}
        aria-label="Select source chain"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center gap-3 h-12 px-4 rounded-card border transition-all duration-micro',
          'bg-bg-surface text-left',
          isOpen
            ? 'border-accent-primary ring-2 ring-accent-primary/20'
            : 'border-border-default hover:border-border-subtle',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          error && 'border-error'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            <span className="text-body text-text-muted">Loading chains...</span>
          </>
        ) : value ? (
          <>
            <ChainIcon chain={value} size="sm" />
            <span className="flex-1 text-body text-text-primary truncate">
              {value.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-body text-text-muted">{placeholder}</span>
        )}

        <ChevronDown
          className={cn(
            'w-5 h-5 text-text-muted transition-transform duration-standard flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Error message with retry */}
      {error && (
        <div className="mt-2 p-3 rounded-lg bg-error/10 border border-error/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-small text-error font-medium">Failed to load chains</p>
              <p className="text-caption text-text-muted mt-0.5">{error}</p>
              {failureCount > 0 && failureCount <= maxRetries && (
                <p className="text-caption text-text-muted mt-1">
                  Retrying... ({failureCount}/{maxRetries})
                </p>
              )}
            </div>
            {onRetry && failureCount >= maxRetries && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium',
                  'bg-error/20 text-error hover:bg-error/30 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-error/50'
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dropdown - MOBILE-001 Fix: Add viewport constraint */}
      {isOpen && (
        <div className="absolute z-50 w-full max-w-[calc(100vw-2rem)] mt-2 bg-bg-elevated border border-border-default rounded-card shadow-lg overflow-hidden animate-fade-in animate-slide-down">
          {/* Search Input */}
          <div className="p-3 border-b border-border-subtle">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chains..."
                className={cn(
                  'w-full h-10 pl-10 pr-10 rounded-lg border border-border-default bg-bg-surface',
                  'text-body text-text-primary placeholder:text-text-muted',
                  'focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20',
                  'transition-all duration-micro'
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Chain List - MOBILE-009 Fix: Better scroll handling for mobile */}
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto overscroll-contain p-2 -webkit-overflow-scrolling-touch">
            {sortedAndFilteredChains.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-body text-text-muted">No chains found</p>
                <p className="text-caption text-text-muted mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <>
                {/* Popular Chains Section */}
                {!search && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-caption text-text-muted uppercase tracking-wider">
                      Popular
                    </p>
                  </div>
                )}

                {/* Chain Options - ref for keyboard scroll-into-view */}
                <div ref={listRef} role="listbox" aria-label="Available chains" className="space-y-1">
                  {sortedAndFilteredChains.map((chain, index) => {
                    // Show divider after popular chains
                    const prevChain = index > 0 ? sortedAndFilteredChains[index - 1] : null;
                    const showDivider =
                      !search &&
                      prevChain &&
                      POPULAR_CHAIN_KEYS.includes(prevChain.key) &&
                      !POPULAR_CHAIN_KEYS.includes(chain.key);

                    return (
                      <React.Fragment key={chain.id}>
                        {showDivider && (
                          <div className="my-2">
                            <div className="border-t border-border-subtle mx-3" />
                            <p className="px-3 py-1.5 text-caption text-text-muted uppercase tracking-wider">
                              All Chains
                            </p>
                          </div>
                        )}
                        <ChainOption
                          chain={chain}
                          balance={balances[chain.id]}
                          isSelected={value?.id === chain.id}
                          searchQuery={search}
                          onClick={() => handleSelect(chain)}
                          isFocused={focusedIndex === index}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer with chain count */}
          <div className="px-3 py-2 border-t border-border-subtle bg-bg-surface">
            <p className="text-caption text-text-muted text-center">
              {sortedAndFilteredChains.length} chain{sortedAndFilteredChains.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChainSelector;
