'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon, FavouriteIcon, Timer02Icon, BitcoinEllipseIcon } from '@hugeicons/core-free-icons';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsStore, SLIPPAGE_PRESETS, SLIPPAGE_MIN, SLIPPAGE_MAX, ROUTE_OPTIONS, type SlippagePreset } from '@/lib/stores/settings-store';
import { useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { RoutePreference } from '@siphoyawe/mina-sdk';

/**
 * Route option icons mapping
 */
const ROUTE_ICONS = {
  recommended: FavouriteIcon,
  fastest: Timer02Icon,
  cheapest: BitcoinEllipseIcon,
} as const;

interface SettingsPanelProps {
  /** Callback when settings change (to trigger quote refetch) */
  onSettingsChange?: () => void;
}

/**
 * Settings Panel Component
 *
 * Slide-out drawer for configuring:
 * - Slippage tolerance (preset buttons + custom input)
 * - Route preference (recommended, fastest, cheapest)
 */
export function SettingsPanel({ onSettingsChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [customSlippageInput, setCustomSlippageInput] = useState('');
  const [slippageInputError, setSlippageInputError] = useState<string | null>(null);
  const customSlippageInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mount check for SSR safety with portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get settings state and actions
  const { slippage, routePreference, isCustomSlippage, setSlippage, setSlippagePreset, setRoutePreference } =
    useSettingsStore(useShallow((state) => ({
      slippage: state.slippage,
      routePreference: state.routePreference,
      isCustomSlippage: state.isCustomSlippage,
      setSlippage: state.setSlippage,
      setSlippagePreset: state.setSlippagePreset,
      setRoutePreference: state.setRoutePreference,
    })));

  // Handle preset slippage selection
  const handleSlippagePreset = useCallback((preset: SlippagePreset) => {
    setSlippagePreset(preset);
    onSettingsChange?.();
  }, [setSlippagePreset, onSettingsChange]);

  // Handle route preference change
  const handleRoutePreferenceChange = useCallback((preference: RoutePreference) => {
    setRoutePreference(preference);
    onSettingsChange?.();
  }, [setRoutePreference, onSettingsChange]);

  // Close panel handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Escape key handler (SETTINGS-004)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Handle custom slippage text input (SETTINGS-001)
  const handleCustomSlippageInput = useCallback((value: string) => {
    // Allow empty input
    if (value === '') {
      setCustomSlippageInput('');
      setSlippageInputError(null);
      return;
    }

    // Remove % sign if user typed it
    const cleanedValue = value.replace(/%/g, '').trim();
    setCustomSlippageInput(cleanedValue);

    // Parse and validate
    const numValue = parseFloat(cleanedValue);

    if (isNaN(numValue)) {
      setSlippageInputError('Enter a valid number');
      return;
    }

    if (numValue < SLIPPAGE_MIN) {
      setSlippageInputError(`Min is ${SLIPPAGE_MIN}%`);
      return;
    }

    if (numValue > SLIPPAGE_MAX) {
      setSlippageInputError(`Max is ${SLIPPAGE_MAX}%`);
      return;
    }

    // Valid input - clear error and apply
    setSlippageInputError(null);
    setSlippage(numValue);
    onSettingsChange?.();
  }, [setSlippage, onSettingsChange]);

  // Sync custom input with slider value when slider changes
  useEffect(() => {
    if (isCustomSlippage) {
      setCustomSlippageInput(slippage.toString());
    }
  }, [slippage, isCustomSlippage]);

  // Portal content for backdrop and panel
  const portalContent = isMounted ? (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]",
            !prefersReducedMotion && "animate-in fade-in duration-200"
          )}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-bg-elevated border-l border-border-subtle z-[9999]",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
          !prefersReducedMotion && "transition-transform duration-300 ease-in-out"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Bridge settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-h3 text-text-primary font-medium">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-bg-surface text-text-secondary hover:text-text-primary"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Slippage Tolerance Section */}
          <section>
            <h3 className="text-body font-medium text-text-primary mb-3">
              Slippage Tolerance
            </h3>
            <p className="text-caption text-text-muted mb-4">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>

            {/* Preset Buttons */}
            <div className="flex gap-2 mb-3">
              {SLIPPAGE_PRESETS.map((preset) => {
                const isSelected = !isCustomSlippage && slippage === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handleSlippagePreset(preset)}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-lg text-small font-medium transition-all",
                      isSelected
                        ? "bg-accent-primary/20 text-accent-primary border border-accent-primary"
                        : "bg-bg-surface text-text-secondary border border-border-subtle hover:border-border-default hover:text-text-primary"
                    )}
                    aria-pressed={isSelected}
                  >
                    {preset}%
                  </button>
                );
              })}
            </div>

            {/* Custom Slider with Text Input (SETTINGS-001) */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-caption text-text-muted">Custom</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Input
                      ref={customSlippageInputRef}
                      type="text"
                      inputMode="decimal"
                      value={customSlippageInput}
                      onChange={(e) => handleCustomSlippageInput(e.target.value)}
                      onFocus={() => {
                        // On focus, show current slippage value if empty
                        if (!customSlippageInput) {
                          setCustomSlippageInput(slippage.toString());
                        }
                      }}
                      onBlur={() => {
                        // On blur, if input is empty or invalid, reset to current slippage
                        if (!customSlippageInput || slippageInputError) {
                          setCustomSlippageInput(slippage.toString());
                          setSlippageInputError(null);
                        }
                      }}
                      placeholder={slippage.toString()}
                      className={cn(
                        "w-16 h-8 px-2 pr-5 text-right text-small font-medium tabular-nums",
                        "bg-bg-surface border rounded-md",
                        slippageInputError
                          ? "border-status-error focus:ring-status-error/20"
                          : "border-border-subtle focus:border-accent-primary"
                      )}
                      aria-label="Custom slippage percentage"
                      aria-invalid={!!slippageInputError}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-small pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
              {slippageInputError && (
                <p className="text-caption text-status-error" role="alert">
                  {slippageInputError}
                </p>
              )}
              <div className="relative">
                <input
                  type="range"
                  min={SLIPPAGE_MIN}
                  max={SLIPPAGE_MAX}
                  step={0.1}
                  value={slippage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setSlippage(value);
                    onSettingsChange?.();
                  }}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none cursor-pointer",
                    "bg-bg-surface border border-border-subtle",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-accent-primary",
                    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20",
                    "[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(125,211,252,0.4)]",
                    "[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150",
                    "[&::-webkit-slider-thumb]:hover:scale-110",
                    "[&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(125,211,252,0.6)]",
                    "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
                    "[&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:bg-accent-primary",
                    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20",
                    "[&::-moz-range-thumb]:shadow-[0_0_10px_rgba(125,211,252,0.4)]"
                  )}
                  aria-label="Custom slippage tolerance"
                />
                {/* Track fill indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-gradient-to-r from-accent-primary/30 to-accent-primary pointer-events-none"
                  style={{ width: `${((slippage - SLIPPAGE_MIN) / (SLIPPAGE_MAX - SLIPPAGE_MIN)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-caption text-text-muted">
                <span>{SLIPPAGE_MIN}%</span>
                <span>{SLIPPAGE_MAX}%</span>
              </div>
            </div>
          </section>

          {/* Route Preference Section */}
          <section>
            <h3 className="text-body font-medium text-text-primary mb-3">
              Route Preference
            </h3>
            <p className="text-caption text-text-muted mb-4">
              Choose how to prioritize your bridge route.
            </p>

            <div className="space-y-2">
              {ROUTE_OPTIONS.map((option) => {
                const iconData = ROUTE_ICONS[option.value];
                const isSelected = routePreference === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleRoutePreferenceChange(option.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                      isSelected
                        ? "bg-accent-primary/10 border border-accent-primary"
                        : "bg-bg-surface border border-border-subtle hover:border-border-default"
                    )}
                    aria-pressed={isSelected}
                  >
                    <HugeiconsIcon
                      icon={iconData}
                      size={20}
                      className={cn(
                        "flex-shrink-0",
                        isSelected ? "text-accent-primary" : "text-text-muted"
                      )}
                    />
                    <div>
                      <div className={cn(
                        "text-small font-medium",
                        isSelected ? "text-text-primary" : "text-text-secondary"
                      )}>
                        {option.label}
                      </div>
                      <div className="text-caption text-text-muted">
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle">
          <p className="text-caption text-text-muted text-center">
            Settings are saved automatically
          </p>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Settings Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Open settings"
      >
        <HugeiconsIcon icon={Settings01Icon} size={20} />
      </Button>

      {/* Portal to body for proper fixed positioning */}
      {isMounted && createPortal(portalContent, document.body)}
    </>
  );
}
