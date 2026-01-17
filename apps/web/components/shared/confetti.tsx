'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useUIStore } from '@/lib/stores/ui-store';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Dark Luxe color palette for confetti
 * Matches the design system colors
 */
const CONFETTI_COLORS = [
  '#7DD3FC', // accent-primary (light blue)
  '#FFFFFF', // white
  '#A1A1AA', // text-secondary (silver)
  '#E5E5E5', // light gray
];

/**
 * Confetti configuration
 */
const CONFETTI_CONFIG = {
  // Animation duration in milliseconds
  duration: 2500,
  // Particle count for main burst
  particleCount: 100,
  // Spread angle for burst effect
  spread: 70,
  // Origin point (center-ish of screen)
  origin: { y: 0.6, x: 0.5 },
  // Gravity and decay for natural fall
  gravity: 1,
  drift: 0,
  // Scalar (size multiplier)
  scalar: 1,
  // Ticks (lifetime in frames)
  ticks: 200,
};

/**
 * Reduced motion configuration (minimal particles)
 */
const REDUCED_MOTION_CONFIG = {
  particleCount: 20,
  spread: 30,
  scalar: 0.5,
  ticks: 100,
};

interface ConfettiCelebrationProps {
  /** Optional external trigger (overrides store) */
  trigger?: boolean;
}

/**
 * Confetti Celebration Component
 *
 * Fires a celebratory confetti animation when triggered.
 * Respects user's reduced motion preferences.
 * Renders nothing to the DOM (confetti renders to its own canvas).
 *
 * Uses the Dark Luxe color palette:
 * - Light blue (#7DD3FC) - accent primary
 * - White (#FFFFFF)
 * - Silver (#A1A1AA)
 * - Light gray (#E5E5E5)
 *
 * @example
 * ```tsx
 * // Using with store trigger
 * function SuccessScreen() {
 *   const { triggerConfetti } = useUIStore();
 *
 *   useEffect(() => {
 *     triggerConfetti();
 *   }, []);
 *
 *   return <ConfettiCelebration />;
 * }
 *
 * // Using with prop trigger
 * <ConfettiCelebration trigger={isComplete} />
 * ```
 */
export function ConfettiCelebration({ trigger }: ConfettiCelebrationProps) {
  const reducedMotion = useReducedMotion();
  const { showConfetti, setShowConfetti } = useUIStore();

  useEffect(() => {
    const shouldFire = trigger || showConfetti;
    if (!shouldFire) return;

    // Track animation frame ID for cleanup
    let animationFrameId: number | null = null;
    let isCancelled = false;

    if (reducedMotion) {
      // Minimal celebration for reduced motion users
      confetti({
        particleCount: REDUCED_MOTION_CONFIG.particleCount,
        spread: REDUCED_MOTION_CONFIG.spread,
        colors: CONFETTI_COLORS,
        disableForReducedMotion: false, // We handle it ourselves
        scalar: REDUCED_MOTION_CONFIG.scalar,
        ticks: REDUCED_MOTION_CONFIG.ticks,
        origin: { y: 0.5, x: 0.5 },
      });
    } else {
      const duration = CONFETTI_CONFIG.duration;
      const end = Date.now() + duration;

      // Initial center burst
      confetti({
        particleCount: CONFETTI_CONFIG.particleCount,
        spread: CONFETTI_CONFIG.spread,
        origin: CONFETTI_CONFIG.origin,
        colors: CONFETTI_COLORS,
        ticks: CONFETTI_CONFIG.ticks,
        gravity: CONFETTI_CONFIG.gravity,
      });

      // Continuous side bursts for duration
      const frame = () => {
        if (isCancelled) return;

        // Left side burst
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: CONFETTI_COLORS,
          ticks: 150,
        });

        // Right side burst
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: CONFETTI_COLORS,
          ticks: 150,
        });

        if (Date.now() < end && !isCancelled) {
          animationFrameId = requestAnimationFrame(frame);
        }
      };

      animationFrameId = requestAnimationFrame(frame);
    }

    // Reset state after animation completes
    const timeout = setTimeout(() => {
      setShowConfetti(false);
    }, CONFETTI_CONFIG.duration + 500);

    // Cleanup: cancel animation frame and timeout on unmount
    return () => {
      isCancelled = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(timeout);
    };
  }, [trigger, showConfetti, reducedMotion, setShowConfetti]);

  // Confetti renders to its own canvas, no DOM element needed
  return null;
}

export default ConfettiCelebration;
