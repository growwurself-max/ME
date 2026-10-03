"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DURATION, EASE, VIEWPORT, fadeIn, fadeUp, scaleIn } from "@/lib/motion";

type RevealVariant = "up" | "in" | "scale";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  amount?: number;
  once?: boolean;
};

const variantMap: Record<RevealVariant, Variants> = {
  up: fadeUp,
  in: fadeIn,
  scale: scaleIn,
};

/**
 * Scroll-triggered entrance. Respects prefers-reduced-motion by rendering
 * the final state immediately.
 */
export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  amount = VIEWPORT.amount,
  once = VIEWPORT.once,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const target = variantMap[variant];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={target}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ duration: DURATION.base, ease: EASE.outExpo, delay }}
    >
      {children}
    </motion.div>
  );
}

type RevealGroupProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
};

/** Parent that staggers direct `<RevealItem />` children on scroll. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = VIEWPORT.amount,
}: RevealGroupProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: VIEWPORT.once, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Child of `RevealGroup`. */
export function RevealItem({
  children,
  className,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={variantMap[variant]}>
      {children}
    </motion.div>
  );
}
