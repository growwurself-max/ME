import { Sun } from 'lucide-react'

const LIGHT_LABELS = ['Morning', 'Afternoon', 'Evening'] as const

export default function LightSimulator({
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