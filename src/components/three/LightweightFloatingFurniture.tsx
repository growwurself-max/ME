import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// Reusable materials for performance
const woodMaterial = new THREE.MeshStandardMaterial({ 
  color: '#a3704c', 
  roughness: 0.6, 
  metalness: 0.1 
})

const fabricMaterial = new THREE.MeshStandardMaterial({ 
  color: '#8B7355', 
  roughness: 0.85, 
  metalness: 0 
})

const brassMaterial = new THREE.MeshStandardMaterial({ 
  color: '#B88E52', 
  roughness: 0.35, 
  metalness: 0.85 
})

interface FloatingItemProps {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  floatSpeed: number
  floatAmplitude: number
  rotationSpeed: number
  seed: number
}

// Deterministic per-seed PRNG (mulberry32) so each item keeps a stable,
// unique drift pattern across renders without the items moving in sync.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Per-item drift parameters: independent phase, direction angle, elliptical
// (X/Z) frequencies and amplitudes. sin/cos-based so the path is continuous,
// smooth and loops forever with no sudden jumps.
function useDriftParams(seed: number) {
  return useMemo(() => {
    const rand = mulberry32(seed)
    const phase = rand() * Math.PI * 2
    const dirAngle = rand() * Math.PI * 2
    const freqX = 0.15 + rand() * 0.25
    const freqZ = 0.15 + rand() * 0.25
    const ampX = 0.25 + rand() * 0.4
    const ampZ = 0.15 + rand() * 0.3
    return { phase, dirAngle, freqX, freqZ, ampX, ampZ }
  }, [seed])
}

// Shared motion: continuous X/Z drifting along the item's own direction plus
// the existing Y bob and slow rotation.
function useFloatingMotion({ position, floatSpeed, floatAmplitude, rotationSpeed, seed }: FloatingItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const drift = useDriftParams(seed)

  useFrame((state) => {
    if (!groupRef.current) return

    const t = state.clock.elapsedTime * floatSpeed
    const cos = Math.cos(drift.dirAngle)
    const sin = Math.sin(drift.dirAngle)
    const lx = Math.sin(t * drift.freqX + drift.phase) * drift.ampX
    const lz = Math.cos(t * drift.freqZ + drift.phase) * drift.ampZ

    // Rotate the elliptical path into this item's personal direction.
    groupRef.current.position.x = position[0] + lx * cos + lz * sin
    groupRef.current.position.z = position[2] - lx * sin + lz * cos
    // Existing gentle bobbing.
    groupRef.current.position.y = position[1] + Math.sin(t) * floatAmplitude
    // Existing slow rotation.
    groupRef.current.rotation.y += rotationSpeed * 0.01
  })

  return groupRef
}

function FloatingChair(props: FloatingItemProps) {
  const { position, rotation, scale } = props
  const groupRef = useFloatingMotion(props)

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Seat */}
      <Box args={[0.4, 0.06, 0.4]} position={[0, 0.25, 0]} material={woodMaterial} />
      {/* Backrest */}
      <Box args={[0.4, 0.35, 0.06]} position={[0, 0.45, -0.18]} material={fabricMaterial} />
      {/* Legs */}
      <Cylinder args={[0.02, 0.02, 0.25]} position={[-0.15, 0.125, -0.15]} material={woodMaterial} />
      <Cylinder args={[0.02, 0.02, 0.25]} position={[0.15, 0.125, -0.15]} material={woodMaterial} />
      <Cylinder args={[0.02, 0.02, 0.25]} position={[-0.15, 0.125, 0.15]} material={woodMaterial} />
      <Cylinder args={[0.02, 0.02, 0.25]} position={[0.15, 0.125, 0.15]} material={woodMaterial} />
    </group>
  )
}

function FloatingTable(props: FloatingItemProps) {
  const { position, rotation, scale } = props
  const groupRef = useFloatingMotion(props)

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Tabletop */}
      <Box args={[0.6, 0.04, 0.35]} position={[0, 0.35, 0]} material={woodMaterial} />
      {/* Legs */}
      <Cylinder args={[0.025, 0.02, 0.3]} position={[-0.25, 0.175, -0.12]} material={woodMaterial} />
      <Cylinder args={[0.025, 0.02, 0.3]} position={[0.25, 0.175, -0.12]} material={woodMaterial} />
      <Cylinder args={[0.025, 0.02, 0.3]} position={[-0.25, 0.175, 0.12]} material={woodMaterial} />
      <Cylinder args={[0.025, 0.02, 0.3]} position={[0.25, 0.175, 0.12]} material={woodMaterial} />
    </group>
  )
}

function FloatingLamp(props: FloatingItemProps) {
  const { position, rotation, scale } = props
  const groupRef = useFloatingMotion(props)

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Shade */}
      <mesh position={[0, 0.5, 0]} material={fabricMaterial}>
        <coneGeometry args={[0.15, 0.2, 16, 1, true]} />
      </mesh>
      {/* Base */}
      <Box args={[0.1, 0.3, 0.1]} position={[0, 0.15, 0]} material={brassMaterial} />
    </group>
  )
}

interface LightweightFloatingFurnitureProps {
  scrollProgress?: number
}

export default function LightweightFloatingFurniture({ scrollProgress = 0 }: LightweightFloatingFurnitureProps) {
  const items = [
    { type: 'chair', position: [-2.5, 0.8, -1.5] as [number, number, number], rotation: [0, 0.5, 0] as [number, number, number], scale: 0.7, floatSpeed: 0.8, floatAmplitude: 0.12, rotationSpeed: 0.3 },
    { type: 'table', position: [2.8, 0.6, -2] as [number, number, number], rotation: [0, -0.3, 0] as [number, number, number], scale: 0.8, floatSpeed: 0.9, floatAmplitude: 0.1, rotationSpeed: 0.25 },
    { type: 'lamp', position: [-1.8, 1, -2.5] as [number, number, number], rotation: [0, 0.8, 0] as [number, number, number], scale: 0.6, floatSpeed: 1.1, floatAmplitude: 0.15, rotationSpeed: 0.35 },
    { type: 'chair', position: [1.5, 0.7, -1.8] as [number, number, number], rotation: [0, -0.6, 0] as [number, number, number], scale: 0.55, floatSpeed: 0.75, floatAmplitude: 0.08, rotationSpeed: 0.2 },
  ]

  return (
    <group>
      {items.map((item, index) => {
        const Component = item.type === 'chair' ? FloatingChair : item.type === 'table' ? FloatingTable : FloatingLamp
        return (
          <Component
            key={index}
            position={item.position}
            rotation={item.rotation}
            scale={item.scale}
            floatSpeed={item.floatSpeed}
            floatAmplitude={item.floatAmplitude}
            rotationSpeed={item.rotationSpeed}
            seed={index * 2654435761 + 1}
          />
        )
      })}
    </group>
  )
}
