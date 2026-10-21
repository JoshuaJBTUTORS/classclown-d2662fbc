import React from 'react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
} as const;

export interface WavingHandProps {
  /** Preset size. Pass a text-* class in className for custom sizes. */
  size?: keyof typeof SIZES;
  /** Set false to show the hand without the wave motion. */
  animated?: boolean;
  /** Optional accessible label. Without it the hand is decorative. */
  label?: string;
  className?: string;
}

/**
 * Reusable waving hand (the one on the welcome page).
 * Usage: <WavingHand size="lg" />
 */
export const WavingHand: React.FC<WavingHandProps> = ({
  size = 'md',
  animated = true,
  label,
  className,
}) => (
  <span
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn(
      'inline-block leading-none',
      animated && 'animate-wave motion-reduce:animate-none',
      SIZES[size],
      className,
    )}
  >
    👋
  </span>
);

export default WavingHand;
