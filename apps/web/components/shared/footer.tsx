'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Terminal, Package, Github, ExternalLink, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  /** Additional class names */
  className?: string;
  /** Whether to show the Pear Protocol link (for trade page) */
  showPearProtocol?: boolean;
  /** Whether to show the Hyperliquid link (for trade page) */
  showHyperliquid?: boolean;
}

/**
 * Footer Component
 *
 * A beautifully designed footer with SDK/CLI links and attribution.
 * Features:
 * - Prominent SDK and CLI links with icons
 * - "Powered by Mina SDK, built by Sipho Yawe" with GitHub link
 * - Gradient separator
 * - Hover animations
 *
 * @example
 * ```tsx
 * <Footer />
 * // or for trade page
 * <Footer showPearProtocol showHyperliquid />
 * ```
 */
export function Footer({ className, showPearProtocol = false, showHyperliquid = false }: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={cn('mt-16 pb-8', className)}
    >
      {/* Separator with gradient */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border-default/50 to-transparent mb-10" />

      {/* Footer Content */}
      <div className="flex flex-col items-center gap-8">
        {/* Main Links Row - SDK & CLI */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Mina SDK - Featured Link */}
          <a
            href="https://www.npmjs.com/package/@siphoyawe/mina-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-b from-bg-surface/80 to-bg-elevated/60 border border-border-subtle hover:border-accent-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(125,211,252,0.15)]"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/5 to-accent-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-accent-primary/10 group-hover:bg-accent-primary/20 transition-colors">
              <Package className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="relative">
              <span className="block text-body font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                Mina SDK
              </span>
              <span className="block text-caption text-text-muted">
                npm package
              </span>
            </div>
            <ExternalLink className="relative w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors ml-1" />
          </a>

          {/* Mina CLI - Featured Link */}
          <a
            href="https://www.npmjs.com/package/@siphoyawe/mina-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-b from-bg-surface/80 to-bg-elevated/60 border border-border-subtle hover:border-accent-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(125,211,252,0.15)]"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/5 to-accent-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-accent-primary/10 group-hover:bg-accent-primary/20 transition-colors">
              <Terminal className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="relative">
              <span className="block text-body font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                Mina CLI
              </span>
              <span className="block text-caption text-text-muted">
                command line
              </span>
            </div>
            <ExternalLink className="relative w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors ml-1" />
          </a>
        </div>

        {/* Secondary Links - Pear Protocol & Hyperliquid (for trade page) */}
        {(showPearProtocol || showHyperliquid) && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {showPearProtocol && (
              <a
                href="https://pearprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/40 border border-border-subtle/50 hover:border-accent-primary/30 hover:bg-bg-elevated/60 transition-all duration-200"
              >
                <span className="text-small text-text-muted group-hover:text-text-secondary transition-colors">
                  Pear Protocol
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-text-muted/60 group-hover:text-accent-primary/60 transition-colors" />
              </a>
            )}
            {showHyperliquid && (
              <a
                href="https://hyperliquid.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/40 border border-border-subtle/50 hover:border-accent-primary/30 hover:bg-bg-elevated/60 transition-all duration-200"
              >
                <span className="text-small text-text-muted group-hover:text-text-secondary transition-colors">
                  Hyperliquid
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-text-muted/60 group-hover:text-accent-primary/60 transition-colors" />
              </a>
            )}
          </div>
        )}

        {/* Attribution - Powered by Mina SDK, built by Sipho Yawe */}
        <div className="flex flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-small text-text-muted/70">
            Powered by{' '}
            <span className="font-semibold bg-gradient-to-r from-accent-primary to-accent-muted bg-clip-text text-transparent">
              Mina SDK
            </span>
          </p>
          <a
            href="https://github.com/SiphoYawe"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-caption text-text-muted/50 hover:text-text-muted transition-colors"
          >
            <span>Built with</span>
            <Heart className="w-3 h-3 text-error/60 group-hover:text-error transition-colors" />
            <span>by</span>
            <span className="font-medium text-text-muted/70 group-hover:text-accent-primary transition-colors">
              Sipho Yawe
            </span>
            <Github className="w-3.5 h-3.5 text-text-muted/50 group-hover:text-accent-primary transition-colors" />
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
