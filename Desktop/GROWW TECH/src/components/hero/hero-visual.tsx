"use client";

import type { PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { DURATION, EASE } from "@/lib/motion";
import { AnalyticsPreview, PlatformPreview, VideoPreview } from "./product-previews";

const SPRING = { stiffness: 110, damping: 20, mass: 0.6 } as const;

/**
 * Layered hero visual: floating product previews with mouse parallax.
 * Parallax is pointer-fine only, so touch devices stay smooth and cheap.
 */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const x = useSpring(pointerX, SPRING);
  const y = useSpring(pointerY, SPRING);

  const rotateY = useTransform(x, [-0.5, 0.5], [7, -7]);
  const rotateX = useTransform(y, [-0.5, 0.5], [-6, 6]);

  const frontX = useTransform(x, [-0.5, 0.5], [16, -16]);
  const frontY = useTransform(y, [-0.5, 0.5], [12, -12]);
  const backX = useTransform(x, [-0.5, 0.5], [-12, 12]);
  const backY = useTransform(y, [-0.5, 0.5], [-9, 9]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: EASE.outExpo, delay: 0.2 }}
      className="relative mx-auto w-full max-w-md [perspective:1600px] sm:max-w-lg lg:max-w-none"
      aria-hidden
    >
      <motion.div
        style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative aspect-4/5 w-full sm:aspect-5/4 lg:aspect-1/1.02"
      >
        {/* Depth plates */}
        <motion.div
          style={reduceMotion ? undefined : { x: backX, y: backY }}
          className="absolute inset-x-6 inset-y-10 -z-10 animate-float-c rounded-[2.25rem] border border-line/70 bg-gradient-to-br from-brand-50/80 via-surface to-canvas-soft blur-[1px]"
        />

        {/* Primary product preview */}
        <motion.div
          style={reduceMotion ? undefined : { x: frontX, y: frontY }}
          className="absolute inset-x-0 top-6 animate-float-a sm:top-8"
        >
          <PlatformPreview />
        </motion.div>

        {/* Floating analytics module */}
        <motion.div
          style={reduceMotion ? undefined : { x: backX, y: frontY }}
          className="absolute -top-2 -left-2 z-20 animate-float-b sm:-left-4 lg:-left-8"
        >
          <AnalyticsPreview />
        </motion.div>

        {/* Floating video module */}
        <motion.div
          style={reduceMotion ? undefined : { x: frontX, y: backY }}
          className="absolute right-0 -bottom-4 z-20 animate-float-c sm:-right-2 lg:-right-6"
        >
          <VideoPreview />
        </motion.div>

        {/* Capability chips */}
        <div className="absolute top-1/2 -right-1 z-30 hidden -translate-y-1/2 animate-float-a lg:block">
          <span className="glass rounded-pill px-3 py-1.5 font-mono text-2xs tracking-wide text-ink-muted uppercase">
            Web apps
          </span>
        </div>
        <div className="absolute -bottom-2 left-4 z-30 animate-float-b sm:left-8">
          <span className="glass rounded-pill px-3 py-1.5 font-mono text-2xs tracking-wide text-ink-muted uppercase">
            SaaS
          </span>
        </div>
      </motion.div>

      <motion.span
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE.outExpo, delay: 0.7 }}
        className="absolute -top-6 right-2 hidden size-16 rounded-full bg-brand-200/50 blur-2xl md:block"
      />
    </motion.div>
  );
}