import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PerformanceConfig } from '../../lib/usePerformanceTier'

/**
 * CameraRig — smooth damping cursor track
 * - Lerps camera position + lookAt from pointer (-1..1)
 * - Low tier: disabled (static camera to save power)
 * - No React state in loop; pure refs + damp
 *
 * Props:
 *   intensity: 0..1 overall strength
 *   rangeX / rangeY: world units
 *   tilt: degrees of roll/pitch added
 */
export default function CameraRig({
  perf,
  intensity = 1,
  rangeX = 0.42,
  rangeY = 0.28,
  tiltDeg = 1.2,
  lookAt = [0, 0.35, 0] as [number, number, number],
  damping = { pos: 0.055, rot: 0.045 },
}: {
  perf: PerformanceConfig
  intensity?: number
  rangeX?: number
  rangeY?: number
  tiltDeg?: number
  lookAt?: [number, number, number]
  damping?: { pos: number; rot: number }
}) {
  const { camera } = useThree()
  const basePos = useMemo(() => camera.position.clone(), []) // capture once
  const baseLookAt = useMemo(() => new THREE.Vector3(...lookAt), [lookAt])
  const tmpLookAt = useRef(new THREE.Vector3(...lookAt))

  // Disable entirely on low / reduced-motion
  const enabled = perf.tier !== 'low' && !perf.prefersReducedMotion

  useFrame((state, delta) => {
    if (!enabled) return

    // Pointer is -1..1 already from r3f
    const px = state.pointer.x
    const py = state.pointer.y

    // Target offsets (intensity scaled per tier)
    const tierScale = perf.tier === 'high' ? 1 : 0.72
    const tx = basePos.x + px * rangeX * intensity * tierScale
    const ty = basePos.y + py * rangeY * intensity * tierScale
    // Keep Z stable to avoid dolly nausea

    // Damp position
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 3.2, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 3.2, delta)

    // Subtle tilt via rotation (roll + pitch) — lerped for silk
    const targetRoll = -px * THREE.MathUtils.degToRad(tiltDeg) * tierScale
    const targetPitch = py * THREE.MathUtils.degToRad(tiltDeg * 0.7) * tierScale
    camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, targetRoll, 2.8, delta)
    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, targetPitch, 2.8, delta)

    // Look-at drift opposite to movement for parallax depth
    tmpLookAt.current.set(
      THREE.MathUtils.lerp(tmpLookAt.current.x, baseLookAt.x - px * 0.18, damping.pos),
      THREE.MathUtils.lerp(tmpLookAt.current.y, baseLookAt.y - py * 0.12, damping.pos),
      baseLookAt.z
    )
    camera.lookAt(tmpLookAt.current)

    // If frameloop="demand", need invalidate to keep reacting
    // @ts-ignore
    if (state.invalidate) state.invalidate()
  })

  return null
}

/**
 * ScrollDrivenGroup — optional wrapper that also reacts to scroll.
 * Use to gently rotate/scale hero content with scroll + mouse.
 */
export function ScrollDrivenGroup({
  perf,
  children,
}: {
  perf: PerformanceConfig
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef({ rot: 0, scale: 1, mx: 0, my: 0 })

  useFrame((state, delta) => {
    if (!ref.current) return
    const track = document.getElementById('scroll-track')
    const y = window.scrollY || document.documentElement.scrollTop
    const max = track ? Math.max(track.scrollHeight - window.innerHeight, 1) : Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
    const p = Math.min(1, y / max)
    const heroP = Math.min(1, p * 4)
    const ease = heroP * heroP * (3 - 2 * heroP)
    const section = Math.floor(p * 3)

    let rot = 0
    let scale = 0.85
    if (section === 0) { rot = THREE.MathUtils.lerp(0, ease * Math.PI * 0.6, 0.6); scale = THREE.MathUtils.lerp(0.85, 0.7, ease) }
    else if (section === 1) { rot = THREE.MathUtils.lerp(0, Math.PI * 0.8, 0.7); scale = THREE.MathUtils.lerp(0.7, 0.55, 0.7) }
    else { rot = THREE.MathUtils.lerp(0, Math.PI * 0.3, 0.8); scale = THREE.MathUtils.lerp(0.55, 0.45, 0.8) }

    const mouseScale = perf.tier === 'high' ? 1 : 0.6
    t.current.rot = THREE.MathUtils.damp(t.current.rot, rot, 3, delta)
    t.current.mx = THREE.MathUtils.damp(t.current.mx, state.pointer.x * 0.45 * mouseScale, 3, delta)
    t.current.my = THREE.MathUtils.damp(t.current.my, state.pointer.y * 0.32 * mouseScale, 3, delta)

    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, t.current.rot, 0.08)
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, scale, 0.08))
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, t.current.mx, 0.05)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, t.current.my, 0.05)
  })

  return <group ref={ref}>{children}</group>
}
