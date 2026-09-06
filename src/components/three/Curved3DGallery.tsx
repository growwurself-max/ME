import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei'
import { GalleryItem } from '../../data/galleryData'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePerformanceTier } from '../../lib/usePerformanceTier'
import { ErrorBoundary } from '../ErrorBoundary'
import CanvasErrorFallback from '../CanvasErrorFallback'
import { ModelSkeleton } from '../ModelSkeleton'

interface Curved3DGalleryProps {
  items: GalleryItem[]
  onItemClick: (item: GalleryItem) => void
}

function GalleryItem3D({
  item,
  index,
  total,
  radius,
  onClick,
}: {
  item: GalleryItem
  index: number
  total: number
  radius: number
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const hovered = useRef(false)

  const angle = (index / total) * Math.PI * 2
  const x = Math.sin(angle) * radius
  const z = Math.cos(angle) * radius - radius
  const rotationY = -angle

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.08
    }
  })

  useEffect(() => {
    if (!groupRef.current) return
    // hover handled via pointer events below
  }, [])

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <group rotation={[0, rotationY, 0]}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onPointerOver={() => { hovered.current = true }}
          onPointerOut={() => { hovered.current = false }}
        >
          <planeGeometry args={[2.05, 1.55]} />
          {/* Transparent hit area — disposed automatically via fiber */}
          <meshStandardMaterial color="#ffffff" roughness={0.42} metalness={0.06} transparent opacity={0.01} />
        </mesh>
        <Html position={[0, 0, 0.02]} transform center distanceFactor={6} zIndexRange={[10, 0]}>
          <div
            className="w-[200px] h-[150px] rounded-[14px] overflow-hidden cursor-pointer shadow-xl border border-white/10"
          >
            <img
              src={item.imagePath}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
              crossOrigin="anonymous"
              decoding="async"
            />
          </div>
        </Html>
      </group>
    </group>
  )
}

function GalleryScene({ items, onItemClick }: { items: GalleryItem[]; onItemClick: (item: GalleryItem) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const rotation = useRef(0)
  const targetRot = useRef(0)
  const perf = usePerformanceTier()

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 2) targetRot.current += e.deltaY * 0.0012
    }
    const el = document.getElementById('gallery-canvas-wrap')
    el?.addEventListener('wheel', onWheel, { passive: true })
    return () => el?.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const el = document.getElementById('gallery-canvas-wrap')
    if (!el) return
    let startX = 0
    let dragging = false
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; dragging = true }
    const onMove = (e: TouchEvent) => {
      if (!dragging) return
      const dx = e.touches[0].clientX - startX
      targetRot.current += dx * 0.0022
      startX = e.touches[0].clientX
    }
    const onEnd = () => { dragging = false }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [])

  useFrame((_, delta) => {
    rotation.current = THREE.MathUtils.damp(rotation.current, targetRot.current, 4, delta)
    if (groupRef.current) groupRef.current.rotation.y = rotation.current
  })

  return (
    <>
      <Environment preset="studio" environmentIntensity={perf.enableShadows ? 0.9 : 0.6} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.15} color="#fffaf2" castShadow={perf.enableShadows} shadow-mapSize={[perf.shadowMapSize, perf.shadowMapSize]} />
      <directionalLight position={[-4, 3, -5]} intensity={0.55} color="#ffe9c9" />
      <ContactShadows position={[0, -1.6, 0]} opacity={perf.tier === 'high' ? 0.28 : 0.18} scale={perf.tier === 'high' ? 18 : 14} blur={perf.tier === 'high' ? 3 : 2} far={6} color="#6b5a44" smooth resolution={perf.tier === 'high' ? 512 : 256} />

      <group ref={groupRef}>
        {items.map((item, index) => (
          <GalleryItem3D key={item.id} item={item} index={index} total={items.length} radius={4.2} onClick={() => onItemClick(item)} />
        ))}
      </group>

      <OrbitControls enableZoom enablePan={false} minDistance={5} maxDistance={10} enableDamping dampingFactor={0.08} autoRotate={false} />
    </>
  )
}

export default function Curved3DGallery({ items, onItemClick }: Curved3DGalleryProps) {
  const perf = usePerformanceTier()

  if (items.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center rounded-2xl" style={{ backgroundColor: '#E2DCD5' }}>
        <p style={{ color: '#54504A' }}>No items to display</p>
      </div>
    )
  }

  // Mobile: show 2D grid fallback handled by parent, but 3D gallery also gated
  // Heavy post-processing already disabled via perf, particle count already 0 on low

  return (
    <div
      id="gallery-canvas-wrap"
      className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #EEE8DE 0%, #E0DAD2 45%, #D4CDC3 100%)' }}
    >
      <ErrorBoundary fallback={<CanvasErrorFallback />}>
        <Canvas
          camera={{ position: [0, 0.6, 8], fov: perf.isMobile ? 60 : 50 }}
          frameloop="demand"
          dpr={perf.dpr}
          gl={{ antialias: perf.tier !== 'low', alpha: true, powerPreference: 'high-performance', stencil: false }}
          performance={{ min: 0.5 }}
          resize={{ scroll: false, debounce: 0 }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            gl.outputColorSpace = THREE.SRGBColorSpace
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <SuspenseWrapper items={items} onItemClick={onItemClick} />
        </Canvas>
      </ErrorBoundary>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-pill px-4 py-2 rounded-full text-xs tracking-wide pointer-events-none" style={{ color: '#1F1D1A' }}>
        {perf.tier === 'low' ? 'Tap to view · 3D paused on low power' : 'Scroll or drag to rotate · Click to inspect'}
      </div>
    </div>
  )
}

// Wrap Suspense outside to avoid conditional hooks
import { Suspense } from 'react'
function SuspenseWrapper({ items, onItemClick }: Curved3DGalleryProps) {
  return (
    <Suspense fallback={<ModelSkeleton label="Loading gallery…" />}>
      <GalleryScene items={items} onItemClick={onItemClick} />
    </Suspense>
  )
}
