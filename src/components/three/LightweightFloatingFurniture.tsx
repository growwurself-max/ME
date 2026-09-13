import { useRef } from 'react'
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
}

function FloatingChair({ position, rotation, scale, floatSpeed, floatAmplitude, rotationSpeed }: FloatingItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Gentle bobbing animation
    const floatY = Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude
    groupRef.current.position.y = position[1] + floatY
    
    // Slow rotation
    groupRef.current.rotation.y += rotationSpeed * 0.01
  })

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

function FloatingTable({ position, rotation, scale, floatSpeed, floatAmplitude, rotationSpeed }: FloatingItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const floatY = Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude
    groupRef.current.position.y = position[1] + floatY
    groupRef.current.rotation.y += rotationSpeed * 0.01
  })

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

function FloatingLamp({ position, rotation, scale, floatSpeed, floatAmplitude, rotationSpeed }: FloatingItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    const floatY = Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude
    groupRef.current.position.y = position[1] + floatY
    groupRef.current.rotation.y += rotationSpeed * 0.01
  })

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
    <group pointer-events="none">
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
          />
        )
      })}
    </group>
  )
}
