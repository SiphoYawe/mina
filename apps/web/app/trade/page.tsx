'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { TradeHeader, TradeTabs, PairTradeForm, BasketTradeForm, SingleAssetTradeForm, PositionsSidebar, type TradeTab } from '@/components/trade';
import { Spotlight } from '@/components/ui/spotlight';
import { Footer } from '@/components/shared/footer';

export default function TradePage() {
  const [activeTab, setActiveTab] = useState<TradeTab>('pair');

  // MOBILE-016 Fix: Allow vertical scrolling on mobile, only hide horizontal overflow
  return (
    <main className="relative min-h-screen min-h-[100dvh] bg-bg-base overflow-x-hidden overflow-y-auto pb-safe">
      {/* Header */}
      <TradeHeader />

      {/* Main Content */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Spotlight Effect */}
        <Spotlight />

        {/* LAYOUT-001 Fix: Changed from fixed 320px sidebar to flexible layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6 lg:gap-8">
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
        <Footer showPearProtocol showHyperliquid />
      </section>
    </main>
  );
}
