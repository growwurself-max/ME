// @ts-nocheck
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import type { PerformanceConfig } from '../../lib/usePerformanceTier'

/**
 * Effects — post-processing pipeline
 * - ACESFilmicToneMapping is set on renderer (in HeroScene onCreated) → cinematic DR
 * - Bloom: mipmapBlur glows on brass/emissive (tier-gated)
 * - Vignette: soft cinematic edges (cheap, always on except low-reduced)
 * - DepthOfField: high-tier only, focusDistance auto from camera distance
 * - Chromatic: velocity-driven (high only)
 *
 * Zero cost when disabled: returns null (no Composer).
 */
export default function Effects({
  perf,
  enableBloom,
  enableVignette,
  enableDoF,
  enableChromatic,
  chromaticStrength = 0.0016,
  bloomIntensity = 0.42,
}: {
  perf: PerformanceConfig
  enableBloom?: boolean
  enableVignette?: boolean
  enableDoF?: boolean
  enableChromatic?: boolean
  chromaticStrength?: number
  bloomIntensity?: number
}) {
  // Disable heavy effects for 60fps performance
  const shouldBloom = false
  const shouldVignette = enableVignette ?? perf.enableVignette
  const shouldDoF = false
  const shouldChroma = false

  const chromaticRef = useRef<any>(null)
  const velocity = useRef(0)
  const lastPos = useRef({ x: 0, y: 0 })
  const targetChroma = useRef(0)

  // Mouse velocity tracker for chromatic
  useEffect(() => {
    if (!shouldChroma) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      velocity.current = Math.min(1, Math.hypot(dx, dy) * 0.005)
      lastPos.current = { x: e.clientX, y: e.clientY }
      targetChroma.current = velocity.current * chromaticStrength * 2.5
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [shouldChroma, chromaticStrength])

  useFrame((_, delta) => {
    if (!chromaticRef.current) return
    velocity.current = THREE.MathUtils.damp(velocity.current, 0, 6, delta)
    targetChroma.current = THREE.MathUtils.damp(targetChroma.current, 0, 4, delta)
    const offset: THREE.Vector2 | undefined = chromaticRef.current.offset
    if (offset) {
      const v = targetChroma.current + velocity.current * 0.0012
      offset.set(v, v * 0.5)
    }
  })

  // Nothing to render? bail before creating Composer (saves render target)
  if (!shouldBloom && !shouldVignette && !shouldDoF && !shouldChroma) return null

  // @ts-ignore — EffectComposer children typing is strict; conditional null is safe at runtime
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {shouldBloom ? (
        <Bloom
          intensity={perf.tier === 'high' ? bloomIntensity : bloomIntensity * 0.72}
          luminanceThreshold={perf.tier === 'high' ? 0.62 : 0.68}
          luminanceSmoothing={0.22}
          mipmapBlur={perf.tier === 'high'}
          radius={0.62}
        />
      ) : null}
      {shouldDoF ? (
        <DepthOfField focusDistance={0.022} focalLength={0.028} bokehScale={perf.tier === 'high' ? 2.2 : 1.6} height={480} />
      ) : null}
      {shouldChroma ? (
        <ChromaticAberration
          ref={chromaticRef}
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0007, 0.00035)}
          radialModulation={false}
          modulationOffset={0.12}
        />
      ) : null}
      {shouldVignette ? <Vignette eskil={false} offset={perf.tier === 'high' ? 0.28 : 0.34} darkness={perf.tier === 'high' ? 0.58 : 0.46} /> : null}
    </EffectComposer>
  )
}
