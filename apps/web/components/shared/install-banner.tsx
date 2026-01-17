'use client';

import { Rocket, Bell, History, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/lib/hooks/use-install-prompt';

interface InstallBannerProps {
  /** Additional class names */
  className?: string;
}

/**
 * Benefits of installing the PWA
 */
const INSTALL_BENEFITS = [
  { icon: Rocket, label: 'Faster access' },
  { icon: Bell, label: 'Push notifications' },
  { icon: History, label: 'Offline history' },
] as const;

/**
 * Install Banner Component
 *
 * A floating banner that prompts users to install the Mina Bridge PWA.
 * Shows after 3+ visits, can be dismissed for 7 days, and provides
 * a native install experience.
 *
 * Features:
 * - Fixed banner at bottom of viewport with smooth slide-up animation
 * - "Install Mina" header with app icon
 * - Three benefit items: Faster access, Push notifications, Offline history
 * - Install and Later buttons
 * - X button to dismiss
 * - Auto-hides when app is installed or recently dismissed
 *
 * Story 11.7 Implementation
 */
export function InstallBanner({ className }: InstallBannerProps) {
  const { shouldShowPrompt, install, dismiss } = useInstallPrompt();

  // Don't render if conditions aren't met
  if (!shouldShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    await install();
  };

  const handleDismiss = () => {
    dismiss();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-banner-title"
      aria-describedby="install-banner-description"
      className={cn(
        // Positioning - fixed at bottom
        'fixed bottom-0 left-0 right-0 z-50',
        // Safe area for mobile devices
        'pb-[env(safe-area-inset-bottom)]',
        // Layout
        'flex flex-col',
        'px-4 py-4 sm:px-6 sm:py-5',
        // Styling - dark theme with subtle glow
        'bg-bg-base/95 backdrop-blur-md',
        'border-t border-border-subtle',
        // Subtle glow effect at top
        'shadow-[0_-4px_30px_rgba(125,211,252,0.15)]',
        // Animation - slide up
        'animate-slide-up',
        className
      )}
    >
      {/* Dismiss X button */}
      <button
        type="button"
        onClick={handleDismiss}
        className={cn(
          'absolute top-3 right-3',
          'p-1.5 rounded-full',
          'text-text-muted hover:text-text-secondary',
          'hover:bg-bg-elevated',
          'transition-colors duration-standard',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
        )}
        aria-label="Dismiss install prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="max-w-md mx-auto w-full">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-3">
          {/* App Icon */}
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-muted/10 ring-1 ring-accent-primary/30">
            <Download className="w-5 h-5 text-accent-primary" />
          </div>

          <div>
            <h2
              id="install-banner-title"
              className="text-body text-text-primary font-semibold"
            >
              Install Mina
            </h2>
            <p
              id="install-banner-description"
              className="text-caption text-text-secondary"
            >
              Add to your home screen
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          {INSTALL_BENEFITS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-small text-text-secondary"
            >
              <Icon className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            className="flex-1 sm:flex-initial"
          >
            Later
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleInstall}
            className="flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InstallBanner;
