import type { ReactNode } from 'react'

/**
 * GlassCard — frosted HUD card with border glow on hover
 * Tailwind + backdrop-blur, inset highlight, brass glow
 * Use for project cards, stats, floating panels
 */
export default function GlassCard({
  children,
  className = '',
  hoverGlow = true,
  dataMagnetic,
}: {
  children: ReactNode
  className?: string
  hoverGlow?: boolean
  dataMagnetic?: string
}) {
  return (
    <div
      data-magnetic={dataMagnetic}
      className={`group relative overflow-hidden rounded-[20px] border bg-white/55 backdrop-blur-xl transition-all duration-500
      ${hoverGlow ? 'hover:shadow-[0_16px_48px_rgba(15,16,21,0.10)] hover:border-[#B88E52]/30 hover:bg-white/70' : ''}
      border-white/30 shadow-[0_8px_32px_rgba(15,16,21,0.06)] ${className}`}
      style={{
        backdropFilter: 'blur(16px) saturate(1.35)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.35)',
      }}
    >
      {/* top inner highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
      {/* brass glow on hover */}
      {hoverGlow && (
        <div className="pointer-events-none absolute -inset-[1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
             style={{ background: 'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(184,142,82,0.18), transparent 40%)' }} />
      )}
      {/* shimmer border */}
      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-white/20 group-hover:border-[#B88E52]/20 transition-colors duration-500" />
      <div className="relative">{children}</div>
    </div>
  )
}

// Usage example:
// <GlassCard className="p-6" dataMagnetic="VIEW PROJECT">
//   <h3 className="font-display text-xl">Walnut Lounge</h3>
//   <p className="text-sm text-[#54504A]">Kiln-dried teak · brass inlay</p>
// </GlassCard>
