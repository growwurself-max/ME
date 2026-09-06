import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

/**
 * PremiumPostProcessing
 * - Bloom: luxury glow on brass highlights (mipMapBlur)
 * - Vignette: cinematic focus
 * - Chromatic Aberration: subtle on mouse velocity (disabled on mobile/low-power)
 */
export default function PremiumPostProcessing({
  enabled = true,
  chromaticStrength = 0.002,
}: {
  enabled?: boolean
  chromaticStrength?: number
}) {
  const chromaticRef = useRef<any>(null)
  const velocity = useRef(0)
  const lastPos = useRef({ x: 0, y: 0 })
  const targetChroma = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      velocity.current = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.006)
      lastPos.current = { x: e.clientX, y: e.clientY }
      targetChroma.current = velocity.current * chromaticStrength * 2.5
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [enabled, chromaticStrength])

  useFrame((_, delta) => {
    if (!chromaticRef.current) return
    // Damp velocity + chroma
    velocity.current = THREE.MathUtils.damp(velocity.current, 0, 6, delta)
    targetChroma.current = THREE.MathUtils.damp(targetChroma.current, 0, 4, delta)
    const offset: THREE.Vector2 | undefined = chromaticRef.current.offset
    if (offset) {
      const v = targetChroma.current + velocity.current * 0.0015
      offset.set(v, v * 0.5)
    }
  })

  if (!enabled) return null

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.62}
      />
      <ChromaticAberration
        ref={chromaticRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0008, 0.0004)}
        radialModulation={false}
        modulationOffset={0.12}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.58} />
    </EffectComposer>
  )
}
