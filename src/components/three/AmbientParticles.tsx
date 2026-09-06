import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PerformanceConfig } from '../../lib/usePerformanceTier'

/**
 * AmbientParticles — floating dust / bokeh
 * - Sprite-less points: cheap PointsMaterial
 * - Reacts gently to mouse: pointer (-1..1) lerps group position + individual drift
 * - Fully disposed on unmount / tier change (geom + mat + second layer)
 * - Tier-gated: low → renders nothing
 */
export default function AmbientParticles({
  perf,
  count: countProp,
  color = '#B88E52',
}: {
  perf: PerformanceConfig
  count?: number
  color?: string
}) {
  const count = countProp ?? perf.maxParticles
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const bokehGeomRef = useRef<THREE.BufferGeometry>(null)
  const bokehMatRef = useRef<THREE.PointsMaterial>(null)

  const velocities = useMemo(() => {
    const v = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      v[i * 3] = (Math.random() - 0.5) * 0.008
      v[i * 3 + 1] = (Math.random() - 0.5) * 0.012
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.008
    }
    return v
  }, [count])

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = Math.random() * 9 - 2.2
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14
    }
    return arr
  }, [count])

  const bokehPositions = useMemo(() => {
    if (perf.tier !== 'high') return new Float32Array(0)
    return positions.slice(0, Math.floor(count * 0.4) * 3)
  }, [positions, count, perf.tier])

  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    target.current.x = state.pointer.x
    target.current.y = state.pointer.y
    current.current.x = THREE.MathUtils.lerp(current.current.x, target.current.x, 0.03)
    current.current.y = THREE.MathUtils.lerp(current.current.y, target.current.y, 0.03)

    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, current.current.x * 0.9, 0.04)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, current.current.y * 0.55 + Math.sin(t * 0.13) * 0.22, 0.04)
      groupRef.current.rotation.y = t * 0.012 + current.current.x * 0.06
      groupRef.current.rotation.x = current.current.y * 0.04
    }

    if (pointsRef.current && geomRef.current) {
      const pos = geomRef.current.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        const ix = i * 3
        pos.array[ix] = (pos.array[ix] as number) + velocities[ix] * delta * 60
        pos.array[ix + 1] = (pos.array[ix + 1] as number) + velocities[ix + 1] * delta * 60
        pos.array[ix + 2] = (pos.array[ix + 2] as number) + velocities[ix + 2] * delta * 60
        const px = pos.array[ix] as number
        const influence = current.current.x * 0.015
        pos.array[ix] = px + influence * Math.sin(t * 0.4 + i * 0.12) * delta * 20
        if (Math.abs(pos.array[ix] as number) > 11) pos.array[ix] = (Math.random() - 0.5) * 18
        if ((pos.array[ix + 1] as number) > 7) pos.array[ix + 1] = -2.5
        if ((pos.array[ix + 1] as number) < -3) pos.array[ix + 1] = 7
        if (Math.abs(pos.array[ix + 2] as number) > 8) pos.array[ix + 2] = (Math.random() - 0.5) * 12
      }
      pos.needsUpdate = true
    }

    if (matRef.current) {
      const speed = Math.hypot(target.current.x - current.current.x, target.current.y - current.current.y)
      matRef.current.opacity = THREE.MathUtils.clamp(0.13 + speed * 0.18 + Math.sin(t * 0.6) * 0.02, 0.08, 0.22)
    }
    // @ts-ignore
    if (state.invalidate) state.invalidate()
  })

  // Complete GC: dispose all buffers + materials on unmount or tier/count change
  useEffect(() => {
    return () => {
      geomRef.current?.dispose()
      matRef.current?.dispose()
      bokehGeomRef.current?.dispose()
      bokehMatRef.current?.dispose()
    }
  }, [count, perf.tier])

  if (perf.tier === 'low' || count === 0) return null

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={perf.tier === 'high' ? 0.035 : 0.028}
          color={color}
          transparent
          opacity={0.14}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {perf.tier === 'high' && (
        <points>
          <bufferGeometry ref={bokehGeomRef}>
            <bufferAttribute attach="attributes-position" args={[bokehPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial ref={bokehMatRef} size={0.11} color="#d9b98c" transparent opacity={0.055} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      )}
    </group>
  )
}
