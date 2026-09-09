import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, Bounds } from '@react-three/drei'
import { Layers, RotateCcw, Sun } from 'lucide-react'
import * as THREE from 'three'
import RoomEnvironment from './RoomEnvironment'
import { GLBModel, ProceduralFurniture } from './ProceduralFurniture'
import type { Finish, Product } from '../../data/products'
import { usePerformanceTier } from '../../lib/usePerformanceTier'
import { ModelSkeleton } from '../ModelSkeleton'
import { ErrorBoundary } from '../ErrorBoundary'

const LIGHT_LABELS = ['Morning', 'Afternoon', 'Evening'] as const

type CraftSpot = { id: string; pos: [number, number, number]; title: string; detail: string }

const CRAFT_SPOTS: Record<Product['shape'], CraftSpot[]> = {
  sofa: [
    {
      id: 'sofa-teak',
      pos: [1.3, 0.85, 0],
      title: '✦ Solid Teak Core',
      detail: 'Kiln-dried hardwood frame, corner-blocked & screwed for decades of use.',
    },
    {
      id: 'sofa-velvet',
      pos: [0, 1.22, 0.35],
      title: '✦ Velvet Hydro-repellent',
      detail: 'Stain-guard seats with hydro-repellent treatment that beads away spills.',
    },
    {
      id: 'sofa-foam',
      pos: [-1.05, 0.55, -0.3],
      title: '✦ HR Foam Core',
      detail: 'High-resilience layers calibrated for balanced sink, bounce & back support.',
    },
  ],
  bed: [
    {
      id: 'bed-teak',
      pos: [0, 0.6, 0],
      title: '✦ Solid Teak Core',
      detail: 'Premium-grade teak slats & frame with anti-warp kiln drying.',
    },
    {
      id: 'bed-hydraulic',
      pos: [0.95, 0.35, -1.25],
      title: '✦ German Hydraulic Lift',
      detail: 'Soft-close gas pistons rated to 10,000 lift cycles with feather-touch release.',
    },
    {
      id: 'bed-headboard',
      pos: [0, 1.45, -1.5],
      title: '✦ Velvet Headboard',
      detail: 'Button-tufted, padded headboard upholstered in stain-guard velvet.',
    },
  ],
  dining: [
    {
      id: 'dining-marble',
      pos: [0, 1.1, 0],
      title: '✦ Italian Marble Top',
      detail: 'Vein-cut, seal-coated stone with a hand-polished brass edge detail.',
    },
    {
      id: 'dining-sheesham',
      pos: [-1.6, 0.55, -0.7],
      title: '✦ Solid Sheesham',
      detail: 'Hand-finished sheesham timber with mortise-and-tenon joinery.',
    },
    {
      id: 'dining-legs',
      pos: [1.6, 0.42, 0.7],
      title: '✦ Tapered Legs',
      detail: 'Hand-turned tapered legs fitted with protective brass ferrules.',
    },
  ],
  mattress: [
    {
      id: 'mat-pockets',
      pos: [0, 0.3, -0.85],
      title: '✦ Pocket Springs',
      detail: 'Individually wrapped 5-zone coils — zero roll-together, full edge support.',
    },
    {
      id: 'mat-foam',
      pos: [0.85, 0.55, 0.6],
      title: '✦ Cooling Memory Foam',
      detail: 'Gel-infused top layer keeps the sleep surface cool through the night.',
    },
    {
      id: 'mat-teak',
      pos: [-0.9, 0.16, 0.95],
      title: '✦ Teak Slat Base',
      detail: 'Solid teak slatted foundation with 8 cm ventilation spacing.',
    },
  ],
  table: [
    {
      id: 'table-tempered',
      pos: [0, 0.84, 0],
      title: '✦ Tempered Glass Option',
      detail: '8 mm toughened top with a rounded, luxury-grade bevel.',
    },
    {
      id: 'table-wood',
      pos: [-1.05, 0.72, 0.4],
      title: '✦ Mango Wood Top',
      detail: 'Sculptural mango-wood surface finished in hand-rubbed oil.',
    },
    {
      id: 'table-brass',
      pos: [1.1, 0.62, -0.35],
      title: '✦ Brushed Brass Inlay',
      detail: 'Hand-set brushed brass detailing along the table apron.',
    },
  ],
}

function LayerPin({
  position,
  label,
  value,
}: {
  position: [number, number, number]
  label: string
  value: string
}) {
  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[20, 0]}>
      <div className="pointer-events-none flex items-center gap-2 whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-[#B88E52] shadow-[0_0_10px_rgba(184,142,82,0.7)]" />
        <span className="glass-pill rounded-full px-3 py-1 text-[11px] text-[#1F1D1A] shadow-glass">
          <b className="text-[#A3704C]">{label}</b>
          <span className="mx-1 text-[#E0DAD2]">·</span>
          <span style={{ color: '#52525B' }}>{value}</span>
        </span>
      </div>
    </Html>
  )
}

function Hotspot({
  position,
  label,
  value,
  open,
  onOpen,
  onClose,
  onToggle,
}: {
  position: [number, number, number]
  label: string
  value: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: () => void
}) {
  return (
    <Html position={position} center distanceFactor={7} zIndexRange={[20, 0]}>
      <div className="flex flex-col items-center">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          onMouseEnter={onOpen}
          onMouseLeave={onClose}
          className="hotspot-pulse relative flex items-center justify-center outline-none"
          aria-label={`${label}: ${value}`}
        >
          <span className="hotspot-dot" />
        </button>
        {open && (
          <div
            className="pointer-events-auto mt-3 w-52 rounded-xl border border-[#B88E52]/35 bg-[#14120F]/90 p-3 text-left shadow-2xl backdrop-blur-xl animate-in"
            style={{ boxShadow: '0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)' }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            <p className="text-[11px] font-semibold tracking-wide text-[#E7C98A]">{label}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#D8D2C8]">{value}</p>
          </div>
        )}
      </div>
    </Html>
  )
}

export function LightSimulator({
  mode,
  onChange,
  compact = false,
}: {
  mode: number
  onChange: (m: number) => void
  compact?: boolean
}) {
  const idx = Math.round(mode * 2)
  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-full ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`} style={{ backgroundColor: 'rgba(232, 227, 220, 0.82)', backdropFilter: 'blur(12px) saturate(1.2)', WebkitBackdropFilter: 'blur(12px) saturate(1.2)', border: '1px solid #D5CEC4' }}>
      <Sun size={compact ? 13 : 15} className="text-[#B88E52] shrink-0" />
      <input
        type="range"
        min={0}
        max={100}
        value={mode * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-24 sm:w-32 accent-[#B88E52] cursor-pointer"
        aria-label="Lighting simulator — morning to evening"
      />
      <span className="text-[11px] tracking-wide min-w-[62px]" style={{ color: '#54504A' }}>{LIGHT_LABELS[idx]}</span>
    </div>
  )
}

export default function Furniture3DViewer({
  product,
  finish,
  className = '',
  interactive = true,
  showHotspots = true,
  showControls = false,
}: {
  product: Product
  finish: Finish
  className?: string
  interactive?: boolean
  showHotspots?: boolean
  showControls?: boolean
}) {
  const [openSpot, setOpenSpot] = useState<string | null>(null)
  const [exploded, setExploded] = useState(false)
  const [lightMode, setLightMode] = useState(0.5)
  const isMattress = product.shape === 'mattress'
  const canExplode = product.shape === 'sofa' || product.shape === 'mattress'
  const explodeT = exploded && canExplode ? 1 : 0

  const spots: CraftSpot[] = CRAFT_SPOTS[product.shape]

  const layerPins = (
    isMattress
      ? [
          { pos: [1.6, -0.55, 1.6] as [number, number, number], label: 'Teak Slat Frame', value: 'Solid wood base' },
          { pos: [-1.6, -0.18, 1.6] as [number, number, number], label: 'Pocket Springs', value: '5-zone support' },
          { pos: [1.6, 0.35, -1.6] as [number, number, number], label: 'HR Foam Core', value: 'High-density comfort' },
          { pos: [-1.6, 0.85, -1.6] as [number, number, number], label: 'Quilted Fabric Top', value: 'Breathable knit cover' },
        ]
      : [
          { pos: [2.2, -0.45, 0.9] as [number, number, number], label: 'Solid Teak Frame', value: 'Kiln-dried hardwood' },
          { pos: [-2.2, 0.05, 0.9] as [number, number, number], label: 'Spring Core', value: 'Webbing & springs' },
          { pos: [2.2, 0.75, -0.6] as [number, number, number], label: 'High-Density Foam', value: 'HR comfort layers' },
          { pos: [-2.2, 1.25, -0.6] as [number, number, number], label: 'Premium Fabric', value: finish.name },
        ]
  )

  const [selectedFinish, setSelectedFinish] = useState<Finish | undefined>(undefined)
  const [is3DActive, setIs3DActive] = useState(false)
  const perf = usePerformanceTier()
  // Spec: Math.min(window.devicePixelRatio, 2) — dynamic resize without stretching
  const dpr = perf.dpr

  useEffect(() => {
    let isActive = false
    const handleActivate = () => { isActive = true; setIs3DActive(true); document.body.style.overflow = 'hidden' }
    const handleDeactivate = () => { isActive = false; setIs3DActive(false); document.body.style.overflow = '' }
    window.addEventListener('3d-controls:activate', handleActivate)
    window.addEventListener('3d-controls:deactivate', handleDeactivate)
    return () => {
      window.removeEventListener('3d-controls:activate', handleActivate)
      window.removeEventListener('3d-controls:deactivate', handleDeactivate)
      if (isActive) document.body.style.overflow = ''
    }
  }, [])

  const activeFinish = selectedFinish ?? finish

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: 280 }}>
      {showControls && (
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
          {canExplode && (
            <button
              onClick={() => setExploded((v) => !v)}
              className={`glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-colors ${
                exploded ? 'text-[#FAF8F5]' : 'text-[#1F1D1A] hover:text-[#A3704C]'
              }`}
              style={exploded ? { background: '#B88E52' } : undefined}
            >
              <Layers size={14} /> {exploded ? 'Assemble' : 'Explore Layers'}
            </button>
          )}
          <button
            onClick={() => setLightMode(0.5)}
            title="Reset lighting"
            className="glass-pill pointer-events-auto hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-[#1F1D1A] transition-colors hover:text-[#A3704C] sm:flex"
            style={{ display: lightMode === 0.5 ? 'none' : undefined }}
          >
            <RotateCcw size={13} /> Reset light
          </button>
        </div>
      )}
      {showControls && (
        <div className="absolute left-3 bottom-3 z-30 sm:left-4 sm:bottom-4">
          <LightSimulator mode={lightMode} onChange={setLightMode} />
        </div>
      )}

      <ErrorBoundary>
        <Canvas
          frameloop="demand"
          dpr={dpr}
          camera={{ position: [3.5, 2.0, 4.5], fov: 35 }}
          gl={{ antialias: perf.tier !== 'low', alpha: true, powerPreference: 'high-performance', stencil: false }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.15
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.shadowMap.enabled = perf.enableShadows
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            // Clamp pixel ratio per spec — prevents stretching and overdraw
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
          resize={{ scroll: false, debounce: 0 }}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={<ModelSkeleton label="Loading model…" />}>
          
          <RoomEnvironment intensity={1.05} lightMode={showControls ? lightMode : undefined} />
          <Bounds fit clip observe margin={0.8}>
            <group position={[0, -0.1, 0]}>
              {product.modelUrl ? (
                <GLBModel url={product.modelUrl} />
              ) : (
                <ProceduralFurniture product={product} finish={activeFinish} explode={explodeT} />
              )}
            </group>
          </Bounds>

          {explodeT > 0 &&
            layerPins.map((p) => (
              <LayerPin key={p.label} position={p.pos} label={p.label} value={p.value} />
            ))}

          {showHotspots &&
            !exploded &&
            spots.map((s) => (
              <Hotspot
                key={s.id}
                position={s.pos}
                label={s.title}
                value={s.detail}
                open={openSpot === s.id}
                onOpen={() => setOpenSpot(s.id)}
                onClose={() => setOpenSpot((cur) => (cur === s.id ? null : cur))}
                onToggle={() => setOpenSpot(openSpot === s.id ? null : s.id)}
              />
            ))}

          <OrbitControls
            enabled={interactive && !is3DActive}
            enablePan={false}
            enableZoom={interactive}
            minDistance={3}
            maxDistance={12}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={interactive}
            autoRotateSpeed={0.9}
            enableDamping
            dampingFactor={0.08}
            target={[0, explodeT > 0 ? 0.6 : 0.3, 0]}
          />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
