import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { usePerformanceTier, useTierOverride } from '../../lib/usePerformanceTier'
import EnvironmentRig from './EnvironmentRig'
import Effects from './Effects'
import AmbientParticles from './AmbientParticles'
import CameraRig, { ScrollDrivenGroup } from './CameraRig'
import LightweightFloatingFurniture from './LightweightFloatingFurniture'
import { ErrorBoundary } from '../ErrorBoundary'
import CanvasErrorFallback from '../CanvasErrorFallback'
import { HeroCanvasSkeleton } from '../ModelSkeleton'

// Handles dynamic resizing without stretching + DPR clamp per spec
function ResizeHandler({ dpr }: { dpr: [number, number] }) {
  const { gl, camera } = useThree()
  useEffect(() => {
    const onResize = () => {
      // Clamp pixel ratio exactly per spec
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      // Ensure renderer size matches canvas without stretching
      const canvas = gl.domElement
      const { clientWidth, clientHeight } = canvas.parentElement ?? canvas
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const cam = camera as THREE.PerspectiveCamera
        cam.aspect = clientWidth / Math.max(1, clientHeight)
        cam.updateProjectionMatrix()
      }
      gl.setSize(clientWidth, clientHeight, false)
    }
    // Use ResizeObserver for container changes, not just window
    const ro = new ResizeObserver(onResize)
    const parent = gl.domElement.parentElement
    if (parent) ro.observe(parent)
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [gl, camera, dpr])
  return null
}

function Loader() {
  return <HeroCanvasSkeleton />
}

export default function HeroScene({
  lightMode = 0.5,
  hdriPath,
}: {
  lightMode?: number
  hdriPath?: string
}) {
  const perfBase = usePerformanceTier()
  const perf = useTierOverride(perfBase)

  const [is3DActive, setIs3DActive] = useState(false)
  const [hintOpacity, setHintOpacity] = useState(1)
  const [fov, setFov] = useState(42)
  const { progress } = useProgress()
  const [canvasReady, setCanvasReady] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const compute = () => setFov(window.innerWidth < 768 ? 52 : 42)
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      const t = setTimeout(() => setCanvasReady(true), 80)
      return () => clearTimeout(t)
    }
  }, [progress])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      setHintOpacity(Math.max(0, 1 - y / 320))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let active = false
    const release = () => { if (!active) return; active=false; setIs3DActive(false); document.body.style.overflow='' }
    const activate = () => { active=true; setIs3DActive(true); document.body.style.overflow='hidden' }
    window.addEventListener('3d-controls:activate', activate)
    window.addEventListener('3d-controls:deactivate', release)
    window.addEventListener('touchend', release)
    window.addEventListener('touchcancel', release)
    window.addEventListener('pointerup', release)
    return () => {
      window.removeEventListener('3d-controls:activate', activate)
      window.removeEventListener('3d-controls:deactivate', release)
      window.removeEventListener('touchend', release)
      window.removeEventListener('touchcancel', release)
      window.removeEventListener('pointerup', release)
      if (active) document.body.style.overflow=''
    }
  }, [])

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    glRef.current = gl
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.18
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.setClearColor(new THREE.Color('#FAF8F5'))
    gl.shadowMap.enabled = perf.enableShadows
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    // Optimize shadow map size for performance
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    // Clamp DPR to 1.5 max for 60fps performance
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const canvas = gl.domElement
    const onLost = (e: Event) => { e.preventDefault(); setWebglFailed(true) }
    const onRestore = () => setWebglFailed(false)
    canvas.addEventListener('webglcontextlost', onLost, false)
    canvas.addEventListener('webglcontextrestored', onRestore, false)
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestore)
    }
  }, [perf.enableShadows])

  // Cleanup renderer on unmount — critical for GC
  useEffect(() => {
    return () => {
      if (glRef.current) {
        glRef.current.dispose()
        // Force context loss to free GPU memory
        glRef.current.forceContextLoss?.()
        // @ts-ignore
        glRef.current = null
      }
    }
  }, [])

  if (webglFailed) {
    return <CanvasErrorFallback onRetry={() => setWebglFailed(false)} />
  }

  return (
    <ErrorBoundary fallback={<CanvasErrorFallback onRetry={() => window.location.reload()} />}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.2, 6], fov }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
        frameloop="always"
        onCreated={handleCreated as any}
        className="fixed inset-0 z-0 w-full h-full transition-opacity duration-700 ease-in-out"
        style={{ opacity: canvasReady ? 1 : 0, touchAction: is3DActive ? 'none' : 'pan-y', width: '100%', height: '100%' }}
        performance={{ min: 0.5 }}
        resize={{ scroll: false, debounce: 0 }}
      >
        <ResizeHandler dpr={perf.dpr} />
        <Suspense fallback={<Loader />}>
          <EnvironmentRig perf={perf} intensity={1.05} lightMode={lightMode} hdriPath={hdriPath} />
          <AmbientParticles perf={perf} />
          <ScrollDrivenGroup perf={perf}><group /></ScrollDrivenGroup>
          <CameraRig perf={perf} intensity={1} />
          <LightweightFloatingFurniture />
          <Html center>
            <div
              className="text-[#9B7A4F] text-[11px] tracking-[0.24em] uppercase whitespace-nowrap transition-opacity duration-500 select-none px-4 py-1.5 rounded-full"
              style={{ opacity: hintOpacity, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(234,229,220,0.7)', color: '#8C6D3F' }}
            >
              Scroll to navigate · Move cursor to explore
            </div>
          </Html>
          <Effects perf={perf} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  )
}
