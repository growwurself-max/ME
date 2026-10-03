import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import MagneticButton from './MagneticButton'

export default function GatewaySplash({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false)
  const [ready, setReady] = useState(0)

  // Lock native scroll while the gateway splash is active.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = ''
    }
  }, [])

  // Simulate the interactive 3D experience spinning up.
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const DURATION = 2200
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      setReady(Math.round(t * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const isReady = ready >= 100

  const handleEnter = () => {
    if (exiting) return
    setExiting(true)
    // Let the fade/scale transition finish before revealing the showroom.
    setTimeout(() => onEnter(), 1000)
  }

  const handleEnded = () => handleEnter()

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#0c0c10] transition-all duration-1000 ease-out ${
        exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        poster="/intro_poster.jpg"
        onEnded={handleEnded}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Champagne / dark gradient vignette for high contrast */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,rgba(0,0,0,0.1)_0%,rgba(10,8,5,0.55)_78%,rgba(5,4,3,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Center UI */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 animate-pulse text-[11px] tracking-[0.5em] text-[#d9b98c] uppercase">
          Welcome
        </p>

        <h1 className="font-display text-4xl tracking-tight text-[#F7F3EE] sm:text-5xl md:text-6xl">
          Mokshaa <span className="text-[#C9A86A]">Enterprises</span>
        </h1>

        <p className="mt-5 max-w-xl font-serif text-sm italic leading-relaxed text-[#E8DDCB] sm:text-base md:text-lg">
          Where Master Craftsmanship Meets Timeless Living
        </p>

        <div className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A86A] to-transparent" />

        {/* Refined frosted-glass gateway pill */}
        <div className="mt-10 w-full max-w-md rounded-2xl border border-white/20 bg-black/30 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] tracking-[0.4em] text-[#E8DDCB]/80 uppercase">
            The Showroom Awaits
          </p>

          <div className="btn-shimmer mt-6 inline-flex w-full">
            <MagneticButton
              onClick={handleEnter}
              label="ENTER"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#d9b98c]/70 bg-[#C9A86A]/15 px-8 py-4 text-sm tracking-[0.18em] uppercase text-[#F7F3EE] backdrop-blur-md transition-all duration-300 hover:bg-[#C9A86A] hover:text-[#141312] hover:shadow-[0_0_44px_rgba(201,168,106,0.6)]"
            >
              Enter the World of Furniture
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticButton>
          </div>

          {/* Interactive 3D experience readiness indicator */}
          <div className="mt-7">
            <div className="flex items-center justify-between text-[10px] tracking-[0.22em] uppercase">
              <span className={`transition-colors ${isReady ? 'text-[#C9A86A]' : 'text-[#E8DDCB]/60'}`}>
                {isReady ? 'Interactive 3D Experience' : 'Preparing your view'}
              </span>
              <span className={`flex items-center gap-1.5 transition-colors ${isReady ? 'text-[#C9A86A]' : 'text-[#E8DDCB]/50'}`}>
                {isReady ? (
                  <>
                    <Check size={12} /> Ready
                  </>
                ) : (
                  `${ready}%`
                )}
              </span>
            </div>
            <div className="mt-2 h-px w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-[#8C6D3F] via-[#E7C98A] to-[#C9A86A] transition-[width] duration-150 ease-out"
                style={{ width: `${ready}%`, boxShadow: '0 0 12px rgba(201,168,106,0.8)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}