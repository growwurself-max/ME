import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

type FurnitureType = 'chair' | 'table' | 'lamp' | 'pouf' | 'stool'

interface FloatingFurnitureProps {
  type: FurnitureType
  position: [number, number, number]
  scale?: number
  rotationSpeed?: number
  floatSpeed?: number
  floatAmplitude?: number
  scrollParallax?: boolean
  scrollProgress?: number
}

const MATERIALS = {
  wood: new THREE.MeshStandardMaterial({ color: '#a3704c', roughness: 0.55, metalness: 0.1 }),
  velvet: new THREE.MeshStandardMaterial({ color: '#2d4a3e', roughness: 0.8, metalness: 0.05 }),
  brass: new THREE.MeshStandardMaterial({ color: '#B88E52', roughness: 0.3, metalness: 0.9 }),
  fabric: new THREE.MeshStandardMaterial({ color: '#8B7355', roughness: 0.9, metalness: 0 }),
}

function ChairMesh({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <group scale={s}>
      {/* Seat */}
      <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.02} position={[0, 0.3, 0]} material={MATERIALS.wood} />
      {/* Backrest */}
      <RoundedBox args={[0.5, 0.4, 0.08]} radius={0.02} position={[0, 0.5, -0.21]} material={MATERIALS.velvet} />
      {/* Legs */}
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} material={MATERIALS.wood}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
      ))}
    </group>
  )
}

function TableMesh({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <group scale={s}>
      {/* Tabletop */}
      <RoundedBox args={[0.8, 0.06, 0.5]} radius={0.03} position={[0, 0.4, 0]} material={MATERIALS.wood} />
      {/* Legs */}
      {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} material={MATERIALS.wood}>
          <cylinderGeometry args={[0.03, 0.025, 0.4, 8]} />
        </mesh>
      ))}
    </group>
  )
}

function LampMesh({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <group scale={s}>
      {/* Shade */}
      <mesh position={[0, 0.6, 0]} material={MATERIALS.velvet}>
        <coneGeometry args={[0.2, 0.25, 32, 1, true]} />
      </mesh>
      {/* Base */}
      <RoundedBox args={[0.15, 0.4, 0.15]} radius={0.02} position={[0, 0.2, 0]} material={MATERIALS.brass} />
      {/* Cord */}
      <mesh position={[0, 0.8, 0]} material={MATERIALS.brass}>
        <cylinderGeometry args={[0.005, 0.005, 0.3, 8]} />
      </mesh>
    </group>
  )
}

function PoufMesh({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <group scale={s}>
      <mesh position={[0, 0.15, 0]} material={MATERIALS.velvet}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 32]} />
      </mesh>
      {/* Tufting detail */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.12, 0.15, Math.sin(angle) * 0.12]} material={MATERIALS.brass}>
            <sphereGeometry args={[0.01, 8, 8]} />
          </mesh>
        )
      })}
    </group>
  )
}

function StoolMesh({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <group scale={s}>
      {/* Seat */}
      <RoundedBox args={[0.35, 0.06, 0.35]} radius={0.02} position={[0, 0.35, 0]} material={MATERIALS.fabric} />
      {/* Legs */}
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.175, z]} material={MATERIALS.wood}>
          <cylinderGeometry args={[0.025, 0.02, 0.35, 8]} />
        </mesh>
      ))}
    </group>
  )
}

export default function FloatingFurniture({
  type,
  position,
  scale = 1,
  rotationSpeed = 0.3,
  floatSpeed = 1,
  floatAmplitude = 0.15,
  scrollParallax = false,
  scrollProgress = 0,
}: FloatingFurnitureProps) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    timeRef.current += delta * floatSpeed
    
    // Gentle floating animation
    const floatY = Math.sin(timeRef.current) * floatAmplitude
    groupRef.current.position.y = position[1] + floatY
    
    // Slow elegant rotation
    groupRef.current.rotation.y += delta * rotationSpeed
    
    // Scroll parallax effect
    if (scrollParallax) {
      groupRef.current.position.x = position[0] + Math.sin(scrollProgress * Math.PI) * 0.5
      groupRef.current.position.z = position[2] + Math.cos(scrollProgress * Math.PI * 0.5) * 0.3
      groupRef.current.rotation.x = scrollProgress * 0.2
    }
  })

  const furnitureMap = {
    chair: <ChairMesh scale={scale} />,
    table: <TableMesh scale={scale} />,
    lamp: <LampMesh scale={scale} />,
    pouf: <PoufMesh scale={scale} />,
    stool: <StoolMesh scale={scale} />,
  }

  return (
    <group ref={groupRef} position={position} pointer-events="none">
      {furnitureMap[type]}
    </group>
  )
}
