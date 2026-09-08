import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function GatewaySplash({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false)

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

        <h1 className="font-display text-4xl tracking-[0.08em] text-[#F7F3EE] sm:text-5xl md:text-6xl">
          Mokshaa <span className="text-[#C9A86A]">Enterprises</span>
        </h1>

        <p className="mt-5 max-w-xl font-body text-sm italic leading-relaxed text-[#E8DDCB] sm:text-base md:text-lg">
          Where Master Craftsmanship Meets Timeless Living
        </p>

        <div className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A86A] to-transparent" />

        <button
          onClick={handleEnter}
          className="group mt-10 inline-flex items-center gap-3 rounded-full border border-[#d9b98c]/60 bg-[#C9A86A]/15 px-8 py-4 text-sm tracking-[0.18em] uppercase text-[#F7F3EE] backdrop-blur-md transition-all duration-300 hover:bg-[#C9A86A] hover:text-[#141312] hover:shadow-[0_0_40px_rgba(201,168,106,0.55)] hover:scale-[1.04]"
        >
          Enter the World of Furniture
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
