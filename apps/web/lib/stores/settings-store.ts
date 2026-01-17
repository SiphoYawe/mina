'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RoutePreference } from '@siphoyawe/mina-sdk';

/**
 * Slippage preset values (percentages)
 */
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0] as const;
export type SlippagePreset = (typeof SLIPPAGE_PRESETS)[number];

/**
 * Slippage validation constraints
 */
export const SLIPPAGE_MIN = 0.01;
export const SLIPPAGE_MAX = 5.0;
export const SLIPPAGE_DEFAULT = 0.5;

/**
 * Route preference options with display info
 */
export const ROUTE_OPTIONS = [
  { value: 'recommended' as const, label: 'Recommended', description: 'Best balance of speed and cost' },
  { value: 'fastest' as const, label: 'Fastest', description: 'Prioritize speed' },
  { value: 'cheapest' as const, label: 'Cheapest', description: 'Lowest fees' },
] as const;

/**
 * Settings store state
 */
interface SettingsState {
  // Slippage tolerance (percentage, e.g., 0.5 = 0.5%)
  slippage: number;
  // Route preference
  routePreference: RoutePreference;
  // Whether using custom slippage (not a preset)
  isCustomSlippage: boolean;
}

/**
 * Settings store actions
 */
interface SettingsActions {
  // Set slippage (validates range)
  setSlippage: (slippage: number) => void;
  // Set to a preset slippage value
  setSlippagePreset: (preset: SlippagePreset) => void;
  // Set route preference
  setRoutePreference: (preference: RoutePreference) => void;
  // Reset to defaults
  resetSettings: () => void;
}

const initialState: SettingsState = {
  slippage: SLIPPAGE_DEFAULT,
  routePreference: 'recommended',
  isCustomSlippage: false,
};

/**
 * Validate slippage value is within range
 */
function validateSlippage(value: number): boolean {
  return value >= SLIPPAGE_MIN && value <= SLIPPAGE_MAX;
}

/**
 * Settings store with persistence
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setSlippage: (slippage) =>
          set(
            () => {
              // Validate range
              if (!validateSlippage(slippage)) {
                return {}; // Don't update if invalid
              }
              // Check if it's a preset value
              const isPreset = SLIPPAGE_PRESETS.includes(slippage as SlippagePreset);
              return {
                slippage,
                isCustomSlippage: !isPreset,
              };
            },
            false,
            'setSlippage'
          ),

        setSlippagePreset: (preset) =>
          set(
            { slippage: preset, isCustomSlippage: false },
            false,
            'setSlippagePreset'
          ),

        setRoutePreference: (routePreference) =>
          set({ routePreference }, false, 'setRoutePreference'),

        resetSettings: () => set(initialState, false, 'resetSettings'),
      }),
      {
        name: 'mina-bridge-settings',
        partialize: (state) => ({
          slippage: state.slippage,
          routePreference: state.routePreference,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);

// Selector hooks for optimized re-renders
export const useSlippage = () => useSettingsStore((state) => state.slippage);
export const useRoutePreference = () => useSettingsStore((state) => state.routePreference);
export const useIsCustomSlippage = () => useSettingsStore((state) => state.isCustomSlippage);
