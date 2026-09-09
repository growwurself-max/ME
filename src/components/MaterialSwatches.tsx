import { Check } from 'lucide-react'
import type { Finish } from '../data/products'

export default function MaterialSwatches({
  active,
  onSelect,
  options,
  className = '',
}: {
  active: Finish
  onSelect: (f: Finish) => void
  options: Finish[]
  className?: string
}) {
  return (
    <div className={`pointer-events-auto absolute right-4 top-1/2 z-30 -translate-y-1/2 ${className}`}>
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/15 bg-black/40 px-2.5 py-3 shadow-2xl backdrop-blur-xl">
        <span
          className="mb-0.5 text-[9px] uppercase tracking-[0.25em] text-[#C9A86A]"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Material
        </span>
        {options.map((s) => {
          const isActive = active.name === s.name
          return (
            <button
              key={s.name}
              title={s.name}
              onClick={() => onSelect(s)}
              aria-pressed={isActive}
              className="group relative grid h-8 w-8 place-items-center rounded-full outline-none"
            >
              <span
                className={`h-7 w-7 rounded-full border transition-all duration-300 ${
                  isActive ? 'scale-110 border-[#E7C98A] ring-2 ring-[#B88E52]/50' : 'border-white/30 group-hover:scale-110'
                }`}
                style={{
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), ${s.color} 48%, ${s.color} 100%)`,
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.45)',
                }}
              />
              {/* label tooltip */}
              <span
                className={`absolute right-full mr-3 whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] tracking-wide text-[#EDE6D8] opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 ${
                  isActive ? 'opacity-100' : ''
                }`}
              >
                {s.name}
              </span>
              {isActive && <Check size={11} className="absolute text-white drop-shadow" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}