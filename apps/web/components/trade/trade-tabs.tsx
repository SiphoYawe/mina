'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TradeTab = 'pair' | 'basket' | 'single';

interface TradeTabsProps {
  activeTab: TradeTab;
  onTabChange: (tab: TradeTab) => void;
  className?: string;
}

const tabs: { id: TradeTab; label: string; description: string }[] = [
  { id: 'pair', label: 'Pair Trade', description: 'Long/Short pair' },
  { id: 'basket', label: 'Basket Trade', description: 'Multi-asset baskets' },
  { id: 'single', label: 'Single Asset', description: 'Individual positions' },
];

export function TradeTabs({ activeTab, onTabChange, className }: TradeTabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-bg-elevated rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-md text-small font-medium transition-all duration-standard',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
            activeTab === tab.id
              ? 'bg-bg-surface text-text-primary shadow-sm border border-border-subtle'
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-surface/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
