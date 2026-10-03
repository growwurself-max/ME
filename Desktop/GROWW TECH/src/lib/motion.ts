import type { Variants } from "motion/react";

/** Easing curves mirrored from globals.css so JS + CSS stay in sync. */
export const EASE = {
  smooth: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
} as const;

export const DURATION = {
  fast: 0.25,
  base: 0.55,
  slow: 0.8,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.outExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE.outExpo },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.outExpo },
  },
};

/** Parent that staggers its children on scroll into view. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const VIEWPORT = { once: true, amount: 0.2 } as const;
