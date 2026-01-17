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
          'flex h-10 w-full rounded-card border border-border-default bg-gradient-to-b from-bg-elevated to-bg-surface px-3 py-2 text-body text-text-primary transition-all duration-micro shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
          'placeholder:text-text-muted',
          'focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:shadow-[0_0_15px_rgba(125,211,252,0.1),inset_0_2px_4px_rgba(0,0,0,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
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
