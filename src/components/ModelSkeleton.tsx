import { Html } from '@react-three/drei'

/**
 * Progressive Loading Skeletons
 * Use as Suspense fallback inside Canvas.
 * Each is ultra-light (no textures) so they appear instantly.
 */

export function ModelSkeleton({ label = 'Loading 3D…' }: { label?: string }) {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#EAE5DC] bg-white/85 px-6 py-5 backdrop-blur-md shadow-md">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B88E52]/30 border-t-[#B88E52]" />
        <p className="text-xs tracking-[0.18em] text-[#6B6864] uppercase">{label}</p>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-[#EAE5DC]">
          <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-[#B88E52]/30 to-transparent" />
        </div>
      </div>
    </Html>
  )
}

/**
 * Inline DOM skeleton for outside Canvas (e.g. card placeholder while model streams)
 */
export function CardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-[#EDE8E1]/60 p-6">
      <div className="h-16 w-16 animate-pulse rounded-xl bg-[#D4CDC3]" />
      <div className="h-3 w-24 animate-pulse rounded-full bg-[#D4CDC3]" />
      <div className="h-3 w-16 animate-pulse rounded-full bg-[#E0DAD2]" />
    </div>
  )
}

export function HeroCanvasSkeleton() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border border-[#EAE5DC] bg-white/70 flex items-center justify-center shadow-md">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EAE5DC] border-t-[#B88E52]" />
        </div>
        <p className="text-[11px] tracking-[0.24em] text-[#6B6864] uppercase">Preparing showroom</p>
      </div>
    </Html>
  )
}
