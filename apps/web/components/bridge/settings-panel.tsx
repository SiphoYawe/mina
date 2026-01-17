'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Settings, X, Star, Clock, DollarSign, AlertCircle } from 'lucide-react';
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
  recommended: Star,
  fastest: Clock,
  cheapest: DollarSign,
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
  const [customSlippageInput, setCustomSlippageInput] = useState('');
  const [slippageError, setSlippageError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

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

  // Sync custom input with store when panel opens
  useEffect(() => {
    if (isOpen && isCustomSlippage) {
      setCustomSlippageInput(slippage.toString());
    }
  }, [isOpen, isCustomSlippage, slippage]);

  // Handle preset slippage selection
  const handleSlippagePreset = useCallback((preset: SlippagePreset) => {
    setSlippagePreset(preset);
    setCustomSlippageInput('');
    setSlippageError(null);
    onSettingsChange?.();
  }, [setSlippagePreset, onSettingsChange]);

  // Handle custom slippage input change
  const handleCustomSlippageChange = useCallback((value: string) => {
    setCustomSlippageInput(value);

    // Clear error on empty
    if (!value.trim()) {
      setSlippageError(null);
      return;
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      setSlippageError('Please enter a valid number');
      return;
    }

    if (numValue < SLIPPAGE_MIN || numValue > SLIPPAGE_MAX) {
      setSlippageError(`Must be between ${SLIPPAGE_MIN}% and ${SLIPPAGE_MAX}%`);
      return;
    }

    setSlippageError(null);
  }, []);

  // Apply custom slippage on blur or Enter
  const applyCustomSlippage = useCallback(() => {
    if (!customSlippageInput.trim() || slippageError) return;

    const numValue = parseFloat(customSlippageInput);
    if (!isNaN(numValue) && numValue >= SLIPPAGE_MIN && numValue <= SLIPPAGE_MAX) {
      setSlippage(numValue);
      onSettingsChange?.();
    }
  }, [customSlippageInput, slippageError, setSlippage, onSettingsChange]);

  // Handle route preference change
  const handleRoutePreferenceChange = useCallback((preference: RoutePreference) => {
    setRoutePreference(preference);
    onSettingsChange?.();
  }, [setRoutePreference, onSettingsChange]);

  // Handle key press for custom input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyCustomSlippage();
    }
  }, [applyCustomSlippage]);

  // Close panel handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Apply any pending custom slippage
    if (customSlippageInput && !slippageError) {
      applyCustomSlippage();
    }
  }, [customSlippageInput, slippageError, applyCustomSlippage]);

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
        <Settings className="w-5 h-5" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-40",
            !prefersReducedMotion && "animate-in fade-in duration-200"
          )}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-bg-elevated border-l border-border-subtle z-50",
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

            {/* Custom Input */}
            <div className="relative">
              <Input
                type="number"
                placeholder="Custom"
                value={customSlippageInput}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                onBlur={applyCustomSlippage}
                onKeyDown={handleKeyDown}
                className={cn(
                  "pr-8",
                  slippageError && "border-error focus:ring-error/30",
                  isCustomSlippage && !slippageError && "border-accent-primary focus:ring-accent-primary/30"
                )}
                min={SLIPPAGE_MIN}
                max={SLIPPAGE_MAX}
                step={0.01}
                aria-invalid={!!slippageError}
                aria-describedby={slippageError ? "slippage-error" : undefined}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-small">
                %
              </span>
            </div>

            {/* Error Message */}
            {slippageError && (
              <div id="slippage-error" className="flex items-center gap-2 mt-2 text-error text-caption" role="alert">
                <AlertCircle className="w-4 h-4" />
                {slippageError}
              </div>
            )}

            {/* Current Value Display */}
            <p className="text-caption text-text-muted mt-2">
              Current: <span className="text-text-primary font-medium">{slippage}%</span>
            </p>
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
                const Icon = ROUTE_ICONS[option.value];
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
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isSelected ? "text-accent-primary" : "text-text-muted"
                    )} />
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
  );
}
