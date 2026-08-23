import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import RoomEnvironment from './RoomEnvironment'
import { ProceduralFurniture } from './ProceduralFurniture'
import { PRODUCTS, FINISH_PRESETS } from '../../data/products'

function Particles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18
      arr[i * 3 + 1] = Math.random() * 8 - 2
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.02
    ref.current.position.y = Math.sin(t * 0.15) * 0.25
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#b88e52" transparent opacity={0.15} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function ScrollRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    // scroll progress across the whole document
    const doc = document.documentElement
    const p = Math.min(1, window.scrollY / (doc.scrollHeight - window.innerHeight || 1))
    const heroP = Math.min(1, p * 4)
    const ease = heroP * heroP * (3 - 2 * heroP)

    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, ease * Math.PI, 0.08)
    const targetScale = THREE.MathUtils.lerp(0.85, 0.55, ease)
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.08))
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, ease * 1.6 - 0.1, 0.08)

    const mouse = state.pointer
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouse.x * 0.6, 0.05)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.2 + mouse.y * 0.4, 0.05)
    state.camera.lookAt(0, 0.3, 0)
  })

  return <group ref={group}>{children}</group>
}

export default function HeroScene({ lightMode = 0.5 }: { lightMode?: number }) {
  const sofa = PRODUCTS[0]
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.2, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15
      }}
      className="!absolute !inset-0"
    >
      <Suspense
        fallback={
          <Html center>
            <div className="text-teak text-sm tracking-widest animate-pulse">LOADING SHOWROOM…</div>
          </Html>
        }
      >
        <RoomEnvironment intensity={1.05} lightMode={lightMode} />
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
          <ScrollRig>
            <ProceduralFurniture product={sofa} finish={FINISH_PRESETS.velvetEmerald} />
          </ScrollRig>
        </Float>
        <Particles />
      </Suspense>
    </Canvas>
  )
}
