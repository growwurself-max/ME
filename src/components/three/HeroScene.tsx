import { Suspense, useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSmoothScroll } from '../../lib/smoothScroll'
import RoomEnvironment from './RoomEnvironment'
import { ProceduralFurniture } from './ProceduralFurniture'
import { PRODUCTS, FINISH_PRESETS } from '../../data/products'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

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

function ScrollRig({
  children,
  lenisRef,
}: {
  children: React.ReactNode
  lenisRef: ReturnType<typeof useSmoothScroll>['lenis']
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return

    // Get scroll progress from Lenis
    const currentScroll = lenisRef.current ? lenisRef.current.scroll : 0
    const doc = document.documentElement
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1)
    const p = Math.min(1, currentScroll / maxScroll)
    const heroP = Math.min(1, p * 4)

    // Bezier curve dampening for smooth camera transitions
    const ease = heroP * heroP * (3 - 2 * heroP)

    // Section-based camera targets
    const section = Math.floor(p * 3)

    let targetRot = 0
    let targetPosY = 0
    let targetScale = 0.85

    if (section === 0) {
      // Hero section - subtle orbit around the piece
      targetRot = THREE.MathUtils.lerp(0, ease * Math.PI, 0.6)
      targetPosY = THREE.MathUtils.lerp(0, ease * 1.6 - 0.1, 0.6)
      targetScale = THREE.MathUtils.lerp(0.85, 0.7, ease)
    } else if (section === 1) {
      // Collection section - pan view to showcase multiple pieces
      targetRot = THREE.MathUtils.lerp(0, Math.PI * 0.8, 0.7)
      targetPosY = THREE.MathUtils.lerp(0.8, 1.2, 0.7)
      targetScale = THREE.MathUtils.lerp(0.7, 0.55, 0.7)
    } else {
      // Craftsmanship section - focus on exploded details
      targetRot = THREE.MathUtils.lerp(0, Math.PI * 0.3, 0.8)
      targetPosY = THREE.MathUtils.lerp(1.2, 1.8, 0.8)
      targetScale = THREE.MathUtils.lerp(0.55, 0.45, 0.8)
    }

    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRot, 0.1)
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.1))
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetPosY, 0.1)

    // Dynamic mouse parallax on top of scroll trajectory
    const mouse = state.pointer
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, mouse.x * 0.8, 0.05)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 1.2 + mouse.y * 0.5, 0.05)

    // Camera always looks at center
    group.current.lookAt(0, 0.3, 0)
  })

  return <group ref={group}>{children}</group>
}

export default function HeroScene({ lightMode = 0.5 }: { lightMode?: number }) {
  const sofa = PRODUCTS[0]
  const { lenis } = useSmoothScroll()
  const [is3DActive, setIs3DActive] = useState(false)

  // Listen for 3D controls activation/deactivation from touch badge
  useEffect(() => {
    const handleActivate = () => {
      setIs3DActive(true)
      document.body.style.overflow = 'hidden'
    }

    const handleDeactivate = () => {
      setIs3DActive(false)
      document.body.style.overflow = ''
    }

    window.addEventListener('3d-controls:activate', handleActivate)
    window.addEventListener('3d-controls:deactivate', handleDeactivate)

    return () => {
      window.removeEventListener('3d-controls:activate', handleActivate)
      window.removeEventListener('3d-controls:deactivate', handleDeactivate)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.2, 6], fov: 42 }}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15
        gl.toneMapping = THREE.ACESFilmicToneMapping
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
          <ScrollRig lenisRef={lenis}>
            <ProceduralFurniture product={sofa} finish={FINISH_PRESETS.velvetEmerald} />
          </ScrollRig>
        </Float>
        <Particles />
        <Html center>
          <div className="text-teak text-sm tracking-widest">
            Scroll to navigate the showroom
          </div>
        </Html>
      </Suspense>
    </Canvas>
  )
}