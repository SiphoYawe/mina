'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI Store State
 *
 * Global UI state for managing visual effects and animations
 */
interface UIState {
  /** Whether to show the confetti celebration animation */
  showConfetti: boolean;
}

/**
 * UI Store Actions
 */
interface UIActions {
  /** Trigger confetti celebration */
  setShowConfetti: (show: boolean) => void;
  /** Trigger confetti and auto-reset after animation */
  triggerConfetti: () => void;
}

const initialState: UIState = {
  showConfetti: false,
};

/**
 * UI Store
 *
 * Manages global UI state including:
 * - Confetti celebration animations
 * - Other visual effects
 *
 * @example
 * ```tsx
 * function SuccessScreen() {
 *   const { triggerConfetti } = useUIStore();
 *
 *   useEffect(() => {
 *     triggerConfetti();
 *   }, [triggerConfetti]);
 *
 *   return <ConfettiCelebration />;
 * }
 * ```
 */
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setShowConfetti: (showConfetti) =>
        set({ showConfetti }, false, 'setShowConfetti'),

      triggerConfetti: () => {
        // Set to true - ConfettiCelebration component handles the reset
        set({ showConfetti: true }, false, 'triggerConfetti');
      },
    }),
    { name: 'UIStore' }
  )
);

// Selector hooks for optimized re-renders
export const useShowConfetti = () => useUIStore((state) => state.showConfetti);
