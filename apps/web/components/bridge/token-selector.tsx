'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';
import type { Token } from '@siphoyawe/mina-sdk';
import { cn } from '@/lib/utils';

/**
 * Popular tokens to show first in the list
 */
const POPULAR_TOKEN_SYMBOLS = ['USDC', 'USDC.E', 'USDT', 'ETH', 'WETH', 'DAI'];

interface TokenSelectorProps {
  /** Currently selected token */
  value: Token | null;
  /** Callback when token is selected */
  onChange: (token: Token) => void;
  /** List of available tokens */
  tokens: Token[];
  /** Token balances (address -> formatted balance string) */
  balances?: Record<string, string>;
  /** Loading state for tokens */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Token icon component with fallback
 */
function TokenIcon({ token, size = 'md' }: { token: Token; size?: 'sm' | 'md' | 'lg' }) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when token changes
  useEffect(() => {
    setHasError(false);
  }, [token.address]);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  if (hasError || !token.logoUrl) {
    // Fallback: First 2 letters of symbol with gradient background
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0'
        )}
      >
        <span className="text-bg-base font-semibold text-caption">
          {token.symbol.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={token.logoUrl}
      alt={`${token.symbol} logo`}
      className={cn(sizeClasses[size], 'rounded-full flex-shrink-0 object-contain')}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Highlight matching text in search results
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
 * Loading skeleton for token rows
 */
function TokenSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 px-3 py-3 rounded-lg animate-pulse">
      {/* Token icon skeleton */}
      <div className="w-8 h-8 rounded-full bg-bg-elevated flex-shrink-0" />

      {/* Token name/symbol skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-4 w-16 bg-bg-elevated rounded mb-1.5" />
        <div className="h-3 w-24 bg-bg-elevated rounded" />
      </div>

      {/* Balance skeleton */}
      <div className="flex flex-col items-end flex-shrink-0">
        <div className="h-4 w-12 bg-bg-elevated rounded mb-1" />
        <div className="h-3 w-10 bg-bg-elevated rounded" />
      </div>
    </div>
  );
}

/**
 * Single token option in the dropdown list
 */
const TokenOption = memo(function TokenOption({
  token,
  balance,
  isSelected,
  searchQuery,
  onClick,
  isFocused,
}: {
  token: Token;
  balance?: string;
  isSelected: boolean;
  searchQuery: string;
  onClick: () => void;
  isFocused?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-micro',
        'hover:bg-bg-elevated focus:bg-bg-elevated focus:outline-none',
        isSelected && 'bg-accent-primary/10 border border-accent-primary/30',
        isFocused && 'bg-bg-elevated ring-2 ring-accent-primary/50'
      )}
    >
      <TokenIcon token={token} size="md" />

      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          'text-small font-medium truncate',
          isSelected ? 'text-accent-primary' : 'text-text-primary'
        )}>
          {highlightMatch(token.symbol, searchQuery)}
        </p>
        <p className="text-caption text-text-muted truncate">
          {highlightMatch(token.name, searchQuery)}
        </p>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        {balance && (
          <p className="text-small text-text-primary font-medium">
            {balance}
          </p>
        )}
        {token.priceUsd && (
          <p className="text-caption text-text-muted">
            ${token.priceUsd.toFixed(2)}
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
 * Token Selector Component
 *
 * Displays a dropdown for selecting the source token in bridge transactions.
 * Features:
 * - Searchable token list
 * - Popular tokens shown first
 * - Token icons, names, and balances
 * - Keyboard navigation support
 */
export function TokenSelector({
  value,
  onChange,
  tokens,
  balances = {},
  isLoading = false,
  error = null,
  disabled = false,
  placeholder = 'Select token',
  className,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Sort and filter tokens
  const sortedAndFilteredTokens = useMemo(() => {
    // Filter by search
    let filtered = tokens;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = tokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower) ||
          token.address.toLowerCase().includes(searchLower)
      );
    }

    // Sort: popular tokens first, then by balance, then alphabetically
    return [...filtered].sort((a, b) => {
      const aSymbolUpper = a.symbol.toUpperCase();
      const bSymbolUpper = b.symbol.toUpperCase();
      const aIsPopular = POPULAR_TOKEN_SYMBOLS.includes(aSymbolUpper);
      const bIsPopular = POPULAR_TOKEN_SYMBOLS.includes(bSymbolUpper);

      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      if (aIsPopular && bIsPopular) {
        return POPULAR_TOKEN_SYMBOLS.indexOf(aSymbolUpper) - POPULAR_TOKEN_SYMBOLS.indexOf(bSymbolUpper);
      }

      // Sort by balance if available
      const aBalance = balances[a.address.toLowerCase()];
      const bBalance = balances[b.address.toLowerCase()];
      if (aBalance && !bBalance) return -1;
      if (!aBalance && bBalance) return 1;

      return a.symbol.localeCompare(b.symbol);
    });
  }, [tokens, search, balances]);

  // Handle token selection
  const handleSelect = useCallback((token: Token) => {
    onChange(token);
    setIsOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  }, [onChange]);

  // Handle keyboard navigation
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
            const maxIndex = sortedAndFilteredTokens.length - 1;
            return prev < maxIndex ? prev + 1 : 0;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const maxIndex = sortedAndFilteredTokens.length - 1;
            return prev > 0 ? prev - 1 : maxIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < sortedAndFilteredTokens.length) {
            const selectedToken = sortedAndFilteredTokens[focusedIndex];
            if (selectedToken) {
              handleSelect(selectedToken);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, sortedAndFilteredTokens, handleSelect]);

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
        aria-label="Select token"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 h-10 px-3 rounded-lg border transition-all duration-micro',
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
            <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
            <span className="text-small text-text-muted">Loading...</span>
          </>
        ) : value ? (
          <>
            <TokenIcon token={value} size="sm" />
            <span className="text-small text-text-primary font-medium">
              {value.symbol}
            </span>
          </>
        ) : (
          <span className="text-small text-text-muted">{placeholder}</span>
        )}

        <ChevronDown
          className={cn(
            'w-4 h-4 text-text-muted transition-transform duration-standard flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-caption text-error">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full sm:w-72 max-w-[calc(100vw-32px)] right-0 mt-2 bg-bg-elevated border border-border-default rounded-card shadow-lg overflow-hidden animate-fade-in animate-slide-down">
          {/* Search Input */}
          <div className="p-3 border-b border-border-subtle">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens..."
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

          {/* Token List */}
          <div className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Available tokens">
            {isLoading ? (
              /* Loading skeleton state */
              <div className="space-y-1">
                <TokenSkeleton />
                <TokenSkeleton />
                <TokenSkeleton />
                <TokenSkeleton />
                <TokenSkeleton />
              </div>
            ) : sortedAndFilteredTokens.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-body text-text-muted">No tokens found</p>
                <p className="text-caption text-text-muted mt-1">
                  {tokens.length === 0
                    ? 'Select a chain to see available tokens'
                    : 'Try a different search term'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Popular Tokens Section */}
                {!search && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-caption text-text-muted uppercase tracking-wider">
                      Popular
                    </p>
                  </div>
                )}

                {/* Token Options */}
                <div ref={listRef} className="space-y-1">
                  {sortedAndFilteredTokens.map((token, index) => {
                    // Show divider after popular tokens
                    const prevToken = index > 0 ? sortedAndFilteredTokens[index - 1] : null;
                    const showDivider =
                      !search &&
                      prevToken &&
                      POPULAR_TOKEN_SYMBOLS.includes(prevToken.symbol.toUpperCase()) &&
                      !POPULAR_TOKEN_SYMBOLS.includes(token.symbol.toUpperCase());

                    return (
                      <React.Fragment key={`${token.chainId}-${token.address}`}>
                        {showDivider && (
                          <div className="my-2">
                            <div className="border-t border-border-subtle mx-3" />
                            <p className="px-3 py-1.5 text-caption text-text-muted uppercase tracking-wider">
                              All Tokens
                            </p>
                          </div>
                        )}
                        <TokenOption
                          token={token}
                          balance={balances[token.address.toLowerCase()]}
                          isSelected={value?.address.toLowerCase() === token.address.toLowerCase()}
                          searchQuery={search}
                          onClick={() => handleSelect(token)}
                          isFocused={focusedIndex === index}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer with token count */}
          <div className="px-3 py-2 border-t border-border-subtle bg-bg-surface">
            <p className="text-caption text-text-muted text-center">
              {sortedAndFilteredTokens.length} token{sortedAndFilteredTokens.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenSelector;
