'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  /** Whether the switch is checked */
  checked?: boolean;
  /** Default checked state for uncontrolled usage */
  defaultChecked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Accessible name for the switch */
  'aria-label'?: string;
  /** ID for label association */
  id?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Switch component
 *
 * A toggle switch with smooth animations and accessible design.
 * Follows shadcn/ui patterns with custom dark luxe styling.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  'aria-label': ariaLabel,
  id,
  className,
}: SwitchProps) {
  // Support both controlled and uncontrolled usage
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleClick = React.useCallback(() => {
    if (disabled) return;

    const newValue = !isChecked;
    if (checked === undefined) {
      setInternalChecked(newValue);
    }
    onCheckedChange?.(newValue);
  }, [isChecked, checked, disabled, onCheckedChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors duration-standard ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        // Track colors
        isChecked
          ? 'bg-accent-primary'
          : 'bg-border-default hover:bg-border-subtle',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Thumb */}
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0',
          'transition-transform duration-standard ease-out-back',
          // Thumb color
          isChecked ? 'bg-bg-base' : 'bg-text-primary',
          // Position
          isChecked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}

export default Switch;
