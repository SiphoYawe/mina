'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // MOBILE-014 Fix: Increased height for better touch targets (44px minimum)
          'flex h-11 min-h-[44px] w-full rounded-card border border-border-default bg-gradient-to-b from-bg-elevated to-bg-surface px-3 py-2 text-body text-text-primary transition-all duration-standard shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
          'placeholder:text-text-muted',
          'hover:border-border-default/80 hover:bg-gradient-to-b hover:from-bg-elevated/90 hover:to-bg-surface/90 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_0_8px_rgba(125,211,252,0.05)]',
          'focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:shadow-[0_0_15px_rgba(125,211,252,0.1),inset_0_2px_4px_rgba(0,0,0,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border-default disabled:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
