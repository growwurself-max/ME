import { useRef, type ReactNode } from 'react'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Finish, Product } from '../../data/products'

function useFinishMaterial(finish: Finish) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: finish.color,
        roughness: finish.roughness,
        metalness: finish.metalness ?? 0.05,
      }),
    [finish]
  )
}

const WOOD: Finish = {
  name: 'teak',
  color: '#a3704c',
  roughness: 0.55,
  metalness: 0.1,
}

/** Animated exploded-view layer: lerps toward base + offset * explode. */
export function Layer({
  base = [0, 0, 0],
  offset = [0, 0, 0],
  explode = 0,
  children,
}: {
  base?: [number, number, number]
  offset?: [number, number, number]
  explode?: number
  children: ReactNode
}) {
  const g = useRef<Group>(null)
  const cur = useRef(0)

  useFrame((_, delta) => {
    if (!g.current) return
    cur.current = THREE.MathUtils.damp(cur.current, explode, 3.5, delta)
    const t = cur.current
    const ease = t * t * (3 - 2 * t)
    g.current.position.set(
      base[0] + offset[0] * ease,
      base[1] + offset[1] * ease,
      base[2] + offset[2] * ease
    )
  })

  return <group ref={g} position={base}>{children}</group>
}

export const EXPLODE_STEP = 0.62

export function ProceduralFurniture({
  product,
  finish,
  explode = 0,
}: {
  product: Product
  finish: Finish
  explode?: number
}) {
  const mat = useFinishMaterial(finish)
  const wood = useFinishMaterial(WOOD)
  const foam = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: 0.95 }),
    []
  )
  const spring = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c9c4bb', roughness: 0.35, metalness: 0.85 }),
    []
  )
  const gold = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#B88E52', roughness: 0.3, metalness: 0.9 }),
    []
  )

  switch (product.shape) {
    case 'sofa':
      return <SofaMesh mat={mat} wood={wood} gold={gold} foam={foam} explode={explode} />
    case 'bed':
      return <BedMesh mat={mat} wood={wood} gold={gold} explode={explode} />
    case 'dining':
      return <DiningMesh mat={mat} wood={wood} />
    case 'mattress':
      return <MattressMesh mat={mat} foam={foam} spring={spring} explode={explode} />
    default:
      return <TableMesh mat={mat} wood={wood} gold={gold} />
  }
}

type MeshProps = {
  mat: THREE.Material
  wood?: THREE.Material
  gold?: THREE.Material
  foam?: THREE.Material
  spring?: THREE.Material
  explode?: number
}

function SofaMesh({ mat, wood, foam, explode = 0 }: MeshProps) {
  const e = EXPLODE_STEP
  return (
    <group>
      {/* Solid Teak Frame */}
      <Layer offset={[0, -e * 0.6, 0]} explode={explode}>
        {[
          [-1.45, -0.6], [1.45, -0.6], [-1.45, 0.6], [1.45, 0.6],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.15, z]} material={wood!}>
            <cylinderGeometry args={[0.07, 0.05, 0.35, 10]} />
          </mesh>
        ))}
        <RoundedBox args={[3.15, 0.22, 1.35]} radius={0.06} position={[0, 0.12, 0]} material={wood!} />
      </Layer>

      {/* Pocket-spring / webbing core */}
      <Layer offset={[0, -e * 0.15, 0]} explode={explode}>
        {[-1.05, 0, 1.05].map((x, i) => (
          <mesh key={i} position={[x, 0.34, 0.08]} material={mat}>
            <boxGeometry args={[1.0, 0.14, 1.3]} />
          </mesh>
        ))}
      </Layer>

      {/* High-Density Foam */}
      <Layer offset={[0, e * 0.55, 0]} explode={explode}>
        {[-1.05, 0, 1.05].map((x, i) => (
          <RoundedBox key={i} args={[1.0, 0.28, 1.35]} radius={0.1} position={[x, 0.64, 0.08]} material={foam!} />
        ))}
        {[-1.05, 0, 1.05].map((x, i) => (
          <RoundedBox key={`b${i}`} args={[1.0, 0.75, 0.22]} radius={0.09} position={[x, 1.15, -0.42]} rotation={[-0.12, 0, 0]} material={foam!} />
        ))}
      </Layer>

      {/* Premium Fabric Outer */}
      <Layer offset={[0, e * 1.25, 0]} explode={explode}>
        <RoundedBox args={[3.4, 0.5, 1.6]} radius={0.12} position={[0, 0.25, 0]} material={mat!} />
        <RoundedBox args={[3.4, 1.2, 0.35]} radius={0.14} position={[0, 1.0, -0.62]} material={mat!} />
        <RoundedBox args={[0.35, 0.9, 1.6]} radius={0.12} position={[-1.52, 0.85, 0]} material={mat!} />
        <RoundedBox args={[0.35, 0.9, 1.6]} radius={0.12} position={[1.52, 0.85, 0]} material={mat!} />
      </Layer>
    </group>
  )
}

function BedMesh({ mat, wood, gold }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[2.4, 0.45, 3.2]} radius={0.08} position={[0, 0.22, 0]} material={wood!} />
      <RoundedBox args={[2.3, 0.35, 3.0]} radius={0.14} position={[0, 0.62, 0]} material={mat!} />
      <RoundedBox args={[2.4, 1.4, 0.18]} radius={0.06} position={[0, 1.0, -1.55]} material={wood!} />
      <mesh position={[0, 1.55, -1.56]} material={gold ?? mat}>
        <boxGeometry args={[1.6, 0.04, 0.02]} />
      </mesh>
      {[0.9, -0.7].map((z, i) => (
        <RoundedBox key={i} args={[1.5, 0.16, 0.6]} radius={0.08} position={[i === 0 ? -0.35 : 0.35, 0.88, z]} rotation={[Math.PI / 2, 0, 0]} material={mat!} />
      ))}
      {[
        [-1.1, -1.5], [1.1, -1.5], [-1.1, 1.5], [1.1, 1.5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.15, z]} material={wood!}>
          <cylinderGeometry args={[0.08, 0.06, 0.4, 10]} />
        </mesh>
      ))}
    </group>
  )
}

function DiningMesh({ mat, wood }: MeshProps) {
  const chairs: [number, number][] = [
    [-0.55, -1.35], [0.55, -1.35],
    [-0.55, 1.35], [0.55, 1.35],
    [-2.25, 0], [2.25, 0],
  ]
  return (
    <group>
      <RoundedBox args={[3.6, 0.16, 1.8]} radius={0.04} position={[0, 1.0, 0]} material={mat!} />
      <mesh position={[0, 0.9, 0]} material={wood!}>
        <boxGeometry args={[3.3, 0.1, 1.5]} />
      </mesh>
      {[[-1.6, -0.75], [1.6, -0.75], [-1.6, 0.75], [1.6, 0.75]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} material={wood!}>
          <cylinderGeometry args={[0.09, 0.06, 0.95, 10]} />
        </mesh>
      ))}
      {chairs.map((p, i) => (
        <ChairMesh key={i} position={p as [number, number]} mat={mat} wood={wood} />
      ))}
    </group>
  )
}

function ChairMesh({ position, mat, wood }: MeshProps & { position: [number, number] }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, Math.atan2(-position[0], -position[1]) || 0, 0]}>
      <RoundedBox args={[0.55, 0.1, 0.55]} radius={0.03} position={[0, 0.55, 0]} material={mat!} />
      <RoundedBox args={[0.55, 0.6, 0.08]} radius={0.03} position={[0, 0.85, -0.24]} material={mat!} />
      {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.26, z]} material={wood!}>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
        </mesh>
      ))}
    </group>
  )
}

function MattressMesh({ mat, foam, spring, wood, explode = 0 }: MeshProps) {
  const springs: JSX.Element[] = []
  for (let x = -0.9; x <= 0.9; x += 0.36) {
    for (let z = -1.3; z <= 1.3; z += 0.36) {
      springs.push(
        <mesh key={`${x}-${z}`} position={[x, 0.18, z]} material={spring!}>
          <torusGeometry args={[0.07, 0.016, 8, 16, Math.PI * 2]} />
        </mesh>
      )
    }
  }
  const e = EXPLODE_STEP
  return (
    <group>
      {/* Teak slat base frame */}
      <Layer offset={[0, -e, 0]} explode={explode}>
        <RoundedBox args={[2.35, 0.14, 3.15]} radius={0.04} position={[0, 0.07, 0]} material={wood ?? mat} />
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.16, -1.2 + i * 0.6]} material={mat}>
            <boxGeometry args={[2.1, 0.04, 0.09]} />
          </mesh>
        ))}
      </Layer>

      {/* Pocket springs */}
      <Layer offset={[0, -e * 0.28, 0]} explode={explode}>
        <group>{springs}</group>
      </Layer>

      {/* High-density foam core */}
      <Layer offset={[0, e * 0.5, 0]} explode={explode}>
        <RoundedBox args={[2.3, 0.42, 3.1]} radius={0.16} position={[0, 0.21, 0]} material={foam!} />
      </Layer>

      {/* Quilted premium fabric top */}
      <Layer offset={[0, e * 1.3, 0]} explode={explode}>
        <RoundedBox args={[2.42, 0.2, 3.2]} radius={0.09} position={[0, 0.32, 0]} material={mat!} />
        <mesh position={[0, 0.43, 0]} material={mat}>
          <boxGeometry args={[2.1, 0.03, 2.9]} />
        </mesh>
      </Layer>
    </group>
  )
}

function TableMesh({ mat, wood, gold }: MeshProps) {
  return (
    <group>
      <RoundedBox args={[2.8, 0.14, 1.4]} radius={0.06} position={[0, 0.75, 0]} material={mat!} />
      <RoundedBox args={[2.2, 0.08, 0.9]} radius={0.04} position={[0, 0.32, 0]} material={wood!} />
      {[[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} material={wood!}>
          <cylinderGeometry args={[0.07, 0.05, 0.72, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.83, 0]} material={gold ?? mat}>
        <boxGeometry args={[2.82, 0.015, 0.03]} />
      </mesh>
    </group>
  )
}

/** Optional GLB loader — used when product.modelUrl is provided. */
export function GLBModel({ url }: { url: string }) {
  const gltf = useGLTF(url)
  return <primitive object={gltf.scene} />
}
