'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Package, ExternalLink } from 'lucide-react';
import { TradeHeader, TradeTabs, PairTradeForm, BasketTradeForm, SingleAssetTradeForm, PositionsSidebar, type TradeTab } from '@/components/trade';
import { Spotlight } from '@/components/ui/spotlight';

export default function TradePage() {
  const [activeTab, setActiveTab] = useState<TradeTab>('pair');

  // MOBILE-016 Fix: Allow vertical scrolling on mobile, only hide horizontal overflow
  return (
    <main className="relative min-h-screen min-h-[100dvh] bg-bg-base overflow-x-hidden overflow-y-auto pb-safe">
      {/* Header */}
      <TradeHeader />

      {/* Main Content */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        {/* Spotlight Effect */}
        <Spotlight />

        {/* LAYOUT-001 Fix: Changed from fixed 320px sidebar to flexible layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-6 lg:gap-8">
          {/* Main Trading Panel */}
          <div className="space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-h2 text-text-primary mb-2">
                Pair Trading
              </h1>
              <p className="text-body text-text-muted">
                Trade 30,000+ pairs on Hyperliquid via Pear Protocol. Go long and short simultaneously with advanced execution.
              </p>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <TradeTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {/* Trade Form */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'pair' && <PairTradeForm />}
              {activeTab === 'basket' && <BasketTradeForm />}
              {activeTab === 'single' && <SingleAssetTradeForm />}
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
            >
              {[
                { label: '30,000+', desc: 'Trading Pairs' },
                { label: 'Up to 50x', desc: 'Leverage' },
                { label: 'Market', desc: '& TWAP Orders' },
                { label: 'TP/SL', desc: 'Risk Management' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="text-center p-4 bg-bg-surface/50 rounded-card border border-border-subtle"
                >
                  <p className="text-h3 text-accent-primary font-mono">{feature.label}</p>
                  <p className="text-caption text-text-muted">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar - Positions */}
          {/* LAYOUT-001 Fix: Show sidebar only on xl screens to prevent awkward gap */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden xl:block"
          >
            <div className="sticky top-8">
              <PositionsSidebar />
            </div>
          </motion.aside>
        </div>

        {/* Mobile/Tablet Positions (Collapsible) */}
        {/* LAYOUT-001 Fix: Show on all screens below xl breakpoint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="xl:hidden mt-8"
        >
          <PositionsSidebar />
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 pb-8"
        >
          {/* Separator */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border-default/50 to-transparent mb-8" />

          {/* Footer Content */}
          <div className="flex flex-col items-center gap-6">
            {/* Links Row */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://pearprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/60 border border-border-subtle hover:border-accent-primary/40 hover:bg-bg-elevated/80 transition-all duration-200"
              >
                <span className="text-caption text-text-muted group-hover:text-text-primary transition-colors">Pear Protocol</span>
                <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-accent-primary transition-colors" />
              </a>

              <a
                href="https://hyperliquid.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/60 border border-border-subtle hover:border-accent-primary/40 hover:bg-bg-elevated/80 transition-all duration-200"
              >
                <span className="text-caption text-text-muted group-hover:text-text-primary transition-colors">Hyperliquid</span>
                <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-accent-primary transition-colors" />
              </a>

              <a
                href="https://www.npmjs.com/package/@siphoyawe/mina-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/60 border border-border-subtle hover:border-accent-primary/40 hover:bg-bg-elevated/80 transition-all duration-200"
              >
                <Terminal className="w-3.5 h-3.5 text-accent-primary" />
                <span className="text-caption text-text-muted group-hover:text-text-primary transition-colors">Mina CLI</span>
              </a>
            </div>

            {/* Attribution */}
            <p className="text-caption text-text-muted/60">
              Powered by <span className="text-accent-primary/80">Mina</span>
            </p>
          </div>
        </motion.footer>
      </section>
    </main>
  );
}
