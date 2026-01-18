'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // MOBILE-007 Fix: Prevent body scroll when dialog is open with proper mobile handling
  React.useEffect(() => {
    if (open) {
      // Store original overflow values
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      // Lock body scroll - use position fixed approach for iOS
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Full-screen scrollable container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Centering container - uses dvh for mobile browser chrome, items-start + my-auto pattern */}
        <div
          className="flex min-h-[100dvh] items-start justify-center px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, onClose, showCloseButton = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative w-full bg-bg-surface border border-border-default rounded-card shadow-lg my-auto mx-auto',
          // Headless UI pattern: parent scrolls, content has max-width
          'max-w-lg',
          // Entrance animation
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            // DIALOG-002 Fix: Proper z-index and positioning
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    );
  }
);
DialogContent.displayName = 'DialogContent';

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={cn('px-6 pt-6 pb-2', className)}>{children}</div>
);

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <h2 className={cn('text-h3 text-text-primary', className)}>{children}</h2>
);

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <p className={cn('text-body text-text-muted mt-1', className)}>{children}</p>
);

interface DialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

const DialogBody = ({ children, className }: DialogBodyProps) => (
  <div className={cn('px-6 py-4', className)}>{children}</div>
);

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DialogFooter = ({ children, className }: DialogFooterProps) => (
  <div className={cn('px-6 pb-6 pt-2 flex justify-end gap-3', className)}>
    {children}
  </div>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
};
