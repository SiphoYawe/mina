'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-card text-small font-medium transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-accent-primary to-accent-muted text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.1),0_0_20px_rgba(125,211,252,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1),0_0_30px_rgba(125,211,252,0.5)] active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-white/10',
        secondary:
          'bg-bg-elevated text-text-primary border border-border-default shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-bg-surface hover:border-accent-primary/50 hover:shadow-[0_0_15px_rgba(125,211,252,0.1)]',
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
        destructive:
          'bg-error text-bg-base hover:bg-error/90',
      },
      size: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
