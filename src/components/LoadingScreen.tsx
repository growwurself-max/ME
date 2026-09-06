import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import gsap from 'gsap'

export default function LoadingScreen({ onDone }: { onDone?: () => void }) {
  const { active, progress } = useProgress()
  const [visible, setVisible] = useState(true)
  const [exit, setExit] = useState(false)

  useEffect(() => {
    if (!active && progress === 100) {
      // elegant hold before cinematic lift
      const t1 = setTimeout(() => setExit(true), 420)
      const t2 = setTimeout(() => {
        setVisible(false)
        onDone?.()
        // dispatch global event so Hero can trigger staggered reveal exactly after preloader
        window.dispatchEvent(new CustomEvent('preloader:done'))
      }, 1120)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [active, progress, onDone])

  // Counter tween — smooth numeric increment
  const display = Math.round(progress)

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0f1015] transition-all duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${exit ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#B88E52]/40 to-transparent" />
      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(184,142,82,0.12),transparent_70%)]" />

      <div className="flex flex-col items-center gap-7 px-6 text-center">
        <p className="text-[11px] tracking-[0.45em] text-[#B88E52]/90 uppercase">Mokshaa Enterprises</p>

        <h1 className="font-display text-5xl md:text-6xl leading-none tracking-tight" style={{ color: '#F4EDE2' }}>
          Crafting <span className="italic gold-gradient-text">Comfort</span>
        </h1>

        {/* Percentage + bar */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl tabular-nums" style={{ color: '#F4EDE2' }}>{display}</span>
            <span className="text-sm text-[#B88E52]">%</span>
          </div>

          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B88E52] to-[#d9b98c] will-change-[width]"
              style={{ width: `${display}%`, transition: 'width 280ms cubic-bezier(0.22,1,0.36,1)' }}
            />
            {/* traveling highlight */}
            <div
              className="absolute inset-y-0 w-20 bg-white/25 blur-[6px] will-change-[left]"
              style={{ left: `calc(${display}% - 40px)`, opacity: active ? 1 : 0, transition: 'left 280ms ease, opacity 300ms' }}
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              {display < 100 ? 'Loading showroom' : 'Entering showroom'}
            </span>
            <span className="text-[10px] tracking-[0.16em] text-white/25 uppercase">{active ? 'Please wait' : 'Ready'}</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed max-w-md" style={{ color: 'rgba(244,237,226,0.48)' }}>
          Preparing soft shadows · HDRI reflections · bokeh particles
        </p>
      </div>

      <div className={`absolute inset-0 -z-10 bg-[#0f1015] transition-transform duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${exit ? '-translate-y-full' : 'translate-y-0'}`} />
    </div>
  )
}
