import { Suspense, useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { useSmoothScroll } from '../../lib/smoothScroll'
import RoomEnvironment from './RoomEnvironment'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#b88e52] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#b88e52] text-sm tracking-widest">
          {Math.round(progress)}%
        </p>
      </div>
    </Html>
  )
}

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

// Drives the 3D rig purely from scroll position. This is READ-ONLY —
// it never writes to window.scrollTo / lenis.scrollTo. Actual scroll
// input is owned entirely by the browser + useSmoothScroll (Lenis),
// so there is nothing here to fight with.
function ScrollRig({
  children,
}: {
  children?: React.ReactNode
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return

    const track = document.getElementById('scroll-track')
    const currentScroll = window.scrollY || document.documentElement.scrollTop
    const maxScroll = track
      ? Math.max(track.scrollHeight - window.innerHeight, 1)
      : Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
    const p = Math.min(1, currentScroll / maxScroll)
    const heroP = Math.min(1, p * 4)

    const ease = heroP * heroP * (3 - 2 * heroP)

    const section = Math.floor(p * 3)

    let targetRot = 0
    let targetPosY = 0
    let targetScale = 0.85

    if (section === 0) {
      targetRot = THREE.MathUtils.lerp(0, ease * Math.PI, 0.6)
      targetPosY = THREE.MathUtils.lerp(0, ease * 1.6 - 0.1, 0.6)
      targetScale = THREE.MathUtils.lerp(0.85, 0.7, ease)
    } else if (section === 1) {
      targetRot = THREE.MathUtils.lerp(0, Math.PI * 0.8, 0.7)
      targetPosY = THREE.MathUtils.lerp(0.8, 1.2, 0.7)
      targetScale = THREE.MathUtils.lerp(0.7, 0.55, 0.7)
    } else {
      targetRot = THREE.MathUtils.lerp(0, Math.PI * 0.3, 0.8)
      targetPosY = THREE.MathUtils.lerp(1.2, 1.8, 0.8)
      targetScale = THREE.MathUtils.lerp(0.55, 0.45, 0.8)
    }

    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRot, 0.1)
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.1))
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetPosY, 0.1)

    const mouse = state.pointer
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, mouse.x * 0.8, 0.05)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 1.2 + mouse.y * 0.5, 0.05)

    group.current.lookAt(0, 0.3, 0)
  })

  return <group ref={group}>{children}</group>
}

export default function HeroScene({ lightMode = 0.5 }: { lightMode?: number }) {
  // Lenis engine itself lives inside this hook (wheel/touch handling,
  // its own RAF loop, etc). We just need it mounted — we don't need to
  // read or drive it directly from here anymore.
  useSmoothScroll()

  const [is3DActive, setIs3DActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [hintOpacity, setHintOpacity] = useState(1)
  const [viewport, setViewport] = useState({ isMobile: false, dpr: [1, 1.75] as [number, number], fov: 42 })

  // Fade the 3D scene in after mount instead of a hard cut from the
  // intro video / hero content.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Read-only scroll listener purely to fade the "scroll to navigate"
  // hint out as the user starts scrolling. Never writes to scroll position.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      setHintOpacity(Math.max(0, 1 - y / 300))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Responsive camera/quality settings. Recomputed on resize so rotating
  // a phone or resizing a browser window doesn't leave stale values.
  useEffect(() => {
    const computeViewport = () => {
      const isMobile = window.innerWidth < 768
      setViewport({
        isMobile,
        dpr: isMobile ? [1, 1.5] : [1, 1.75],
        fov: isMobile ? 52 : 42,
      })
    }
    computeViewport()
    window.addEventListener('resize', computeViewport)
    return () => window.removeEventListener('resize', computeViewport)
  }, [])

  // Handles the touch-drag "3D controls" mode (dispatched elsewhere,
  // e.g. a touch badge component). Locks page scroll only while active,
  // with multiple failsafes so it can never stay locked permanently.
  useEffect(() => {
    let isActive = false

    const release = () => {
      if (!isActive) return
      isActive = false
      setIs3DActive(false)
      document.body.style.overflow = ''
    }

    const activate = () => {
      isActive = true
      setIs3DActive(true)
      document.body.style.overflow = 'hidden'
    }

    window.addEventListener('3d-controls:activate', activate)
    window.addEventListener('3d-controls:deactivate', release)
    // Failsafes: if the dispatching component misses a deactivate event
    // (interrupted gesture, touch cancel, etc.), scroll must not stay locked.
    window.addEventListener('touchend', release)
    window.addEventListener('touchcancel', release)
    window.addEventListener('pointerup', release)

    return () => {
      window.removeEventListener('3d-controls:activate', activate)
      window.removeEventListener('3d-controls:deactivate', release)
      window.removeEventListener('touchend', release)
      window.removeEventListener('touchcancel', release)
      window.removeEventListener('pointerup', release)
      if (isActive) {
        document.body.style.overflow = ''
      }
    }
  }, [])

  return (
    <Canvas
      dpr={viewport.dpr}
      camera={{ position: [0, 1.2, 6], fov: viewport.fov }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.setClearColor(new THREE.Color('#0f1015'))
      }}
      className="fixed inset-0 z-0 w-full h-full transition-opacity duration-[1200ms] ease-out"
      style={{ opacity: ready ? 1 : 0, touchAction: is3DActive ? 'none' : 'pan-y', backgroundColor: '#0f1015' }}
    >
      <Suspense fallback={<Loader />}>
        <RoomEnvironment intensity={1.05} lightMode={lightMode} />
        <Particles />
        <ScrollRig />
        <Html center>
          <div
            className="text-teak text-sm tracking-widest transition-opacity duration-500"
            style={{ opacity: hintOpacity }}
          >
            Scroll to navigate the showroom
          </div>
        </Html>
        {!viewport.isMobile && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.35} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
            <Vignette eskil={false} offset={0.25} darkness={0.6} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  )
}