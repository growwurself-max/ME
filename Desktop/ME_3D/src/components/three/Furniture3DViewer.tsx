import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, Center, Bounds } from '@react-three/drei'
import { Layers, RotateCcw, Sun } from 'lucide-react'
import RoomEnvironment from './RoomEnvironment'
import { GLBModel, ProceduralFurniture } from './ProceduralFurniture'
import type { Finish, Product } from '../../data/products'

const LIGHT_LABELS = ['Morning', 'Afternoon', 'Evening'] as const

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
        <span className="h-2 w-2 rounded-full bg-brass shadow-[0_0_10px_rgba(184,142,82,0.7)]" />
        <span className="glass-pill rounded-full px-3 py-1 text-[11px] text-obsidian shadow-glass">
          <b className="text-teak">{label}</b>
          <span className="mx-1 text-oat">·</span>
          <span className="text-slate">{value}</span>
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
  onToggle,
}: {
  position: [number, number, number]
  label: string
  value: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <Html position={position} center distanceFactor={7} zIndexRange={[20, 0]}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="relative flex items-center justify-center outline-none"
        aria-label={`${label}: ${value}`}
      >
        <span className="absolute inline-flex h-5 w-5 rounded-full bg-brass/40 animate-ping" />
        <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-brass shadow-lg" />
        {open && (
          <span className="absolute top-6 whitespace-nowrap glass-pill px-3 py-1.5 text-xs text-obsidian shadow-xl">
            <b className="text-teak">{label}</b> · {value}
          </span>
        )}
      </button>
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
    <div className={`pointer-events-auto flex items-center gap-3 rounded-full ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`} style={{ backgroundColor: 'rgba(232, 227, 220, 0.8)', backdropFilter: 'blur(12px) saturate(1.2)', WebkitBackdropFilter: 'blur(12px) saturate(1.2)', border: '1px solid #D5CEC4' }}>
      <Sun size={compact ? 13 : 15} className="text-brass shrink-0" />
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
  const d = product.dimensions
  const isMattress = product.shape === 'mattress'
  const canExplode = product.shape === 'sofa' || product.shape === 'mattress'
  const explodeT = exploded && canExplode ? 1 : 0

  const spots: { id: string; pos: [number, number, number]; label: string; value: string }[] = [
    { id: 'w', pos: [d.width / 200, d.height / 100 + 0.35, d.depth / 150], label: 'Width', value: `${d.width} cm` },
    { id: 'h', pos: [-d.width / 160, d.height / 80 + 0.55, 0], label: 'Height', value: `${d.height} cm` },
    { id: 'd', pos: [0, d.height / 120 + 0.2, d.depth / 110], label: 'Depth', value: `${d.depth} cm` },
  ]

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

  return (
    <div className={`relative ${className}`}>
      {showControls && (
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
          {canExplode && (
            <button
              onClick={() => setExploded((v) => !v)}
              className={`glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-colors ${
                exploded ? 'text-alabaster' : 'text-obsidian hover:text-teak'
              }`}
              style={exploded ? { background: '#B88E52' } : undefined}
            >
              <Layers size={14} /> {exploded ? 'Assemble' : 'Explore Layers'}
            </button>
          )}
          <button
            onClick={() => setLightMode(0.5)}
            title="Reset lighting"
            className="glass-pill pointer-events-auto hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-obsidian transition-colors hover:text-teak sm:flex"
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

      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [4.2, 2.2, 5.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.15
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="text-teak text-xs tracking-widest animate-pulse">LOADING…</div>
            </Html>
          }
        >
          <RoomEnvironment intensity={1.05} lightMode={showControls ? lightMode : undefined} />
          <Bounds fit clip observe margin={1.15}>
            <group position={[0, -0.15, 0]}>
              {product.modelUrl ? (
                <GLBModel url={product.modelUrl} />
              ) : (
                <ProceduralFurniture product={product} finish={finish} explode={explodeT} />
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
                label={s.label}
                value={s.value}
                open={openSpot === s.id}
                onToggle={() => setOpenSpot(openSpot === s.id ? null : s.id)}
              />
            ))}
          <OrbitControls
            enabled={interactive}
            enablePan={false}
            enableZoom={interactive}
            minDistance={3}
            maxDistance={12}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={interactive}
            autoRotateSpeed={1.1}
            enableDamping
            dampingFactor={0.08}
            target={[0, explodeT > 0 ? 0.6 : 0.3, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
