import { useEffect, useState, useMemo } from 'react'

export type Tier = 'high' | 'medium' | 'low'

export interface PerformanceConfig {
  tier: Tier
  isMobile: boolean
  prefersReducedMotion: boolean
  dpr: [number, number]
  maxParticles: number
  enableBloom: boolean
  enableVignette: boolean
  enableDoF: boolean
  enableChromatic: boolean
  enableShadows: boolean
  shadowMapSize: number
  envIntensity: number
}

/**
 * usePerformanceTier — single source of truth for adaptive quality.
 * Detects:
 *  - pointer:coarse / small viewport → mobile
 *  - navigator.hardwareConcurrency / deviceMemory
 *  - prefers-reduced-motion
 *  - capped DPR
 * Returns a memoized config to gate every heavy effect.
 */
export function usePerformanceTier(): PerformanceConfig {
  const [state, setState] = useState<PerformanceConfig>(() => computeTier())

  useEffect(() => {
    const onResize = () => setState(computeTier())
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => setState(computeTier())
    // Safari compat
    if (mql.addEventListener) mql.addEventListener('change', onMotion)
    else mql.addListener(onMotion)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (mql.removeEventListener) mql.removeEventListener('change', onMotion)
      else mql.removeListener(onMotion)
    }
  }, [])

  return state
}

function computeTier(): PerformanceConfig {
  if (typeof window === 'undefined') {
    return baseConfig('high', false, false)
  }
  const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cores = (navigator as any).hardwareConcurrency ?? 4
  const memory = (navigator as any).deviceMemory ?? 4 // GB, Chrome only
  const isLowPower = cores <= 4 && memory <= 4
  const isVeryLow = cores <= 2 || memory <= 2

  // Spec: Math.min(window.devicePixelRatio, 2) — exact clamp, no stretching
  const rawDpr = Math.min(window.devicePixelRatio || 1, 2)

  let tier: Tier = 'high'
  if (prefersReducedMotion || isVeryLow) tier = 'low'
  else if (isMobile || isLowPower) tier = 'medium'

  return baseConfig(tier, isMobile, prefersReducedMotion, rawDpr)
}

function baseConfig(tier: Tier, isMobile: boolean, reduced: boolean, rawDpr = 1.5): PerformanceConfig {
  if (reduced) {
    return {
      tier: 'low',
      isMobile,
      prefersReducedMotion: reduced,
      dpr: [1, 1],
      maxParticles: 0,
      enableBloom: false,
      enableVignette: false,
      enableDoF: false,
      enableChromatic: false,
      enableShadows: false,
      shadowMapSize: 512,
      envIntensity: 0.7,
    }
  }
  switch (tier) {
    case 'low':
      return {
        tier,
        isMobile,
        prefersReducedMotion: false,
        dpr: [1, 1],
        maxParticles: 0,
        enableBloom: false,
        enableVignette: true,
        enableDoF: false,
        enableChromatic: false,
        enableShadows: false,
        shadowMapSize: 512,
        envIntensity: 0.8,
      }
    case 'medium':
      return {
        tier,
        isMobile,
        prefersReducedMotion: false,
        dpr: [1, Math.min(1.5, rawDpr)] as [number, number],
        maxParticles: 80,
        enableBloom: true,
        enableVignette: true,
        enableDoF: false,
        enableChromatic: false,
        enableShadows: true,
        shadowMapSize: 1024,
        envIntensity: 1.0,
      }
    case 'high':
    default:
      return {
        tier,
        isMobile,
        prefersReducedMotion: false,
        dpr: [1, Math.min(2, rawDpr)] as [number, number],
        maxParticles: 180,
        enableBloom: true,
        enableVignette: true,
        enableDoF: true,
        enableChromatic: true,
        enableShadows: true,
        shadowMapSize: 2048,
        envIntensity: 1.1,
      }
  }
}

// Manual override for QA (e.g. ?tier=low)
export function useTierOverride(base: PerformanceConfig): PerformanceConfig {
  return useMemo(() => {
    if (typeof window === 'undefined') return base
    const p = new URLSearchParams(window.location.search).get('tier') as Tier | null
    if (p && ['high', 'medium', 'low'].includes(p)) {
      // re-derive with forced tier but keep isMobile/dpr reality
      return baseConfig(p, base.isMobile, base.prefersReducedMotion, base.dpr[1])
    }
    return base
  }, [base])
}
