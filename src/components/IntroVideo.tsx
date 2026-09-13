import { useState, useEffect } from 'react'

export default function IntroVideo() {
  const [exiting, setExiting] = useState(false)
  const [visible, setVisible] = useState(true)

  const handleVideoEnd = () => {
    setExiting(true)
    // Allow fade-out transition to complete before unmounting
    setTimeout(() => setVisible(false), 1000)
  }

  const handleSkip = () => {
    handleVideoEnd()
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#0c0c10] transition-all duration-1000 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Champagne / dark gradient vignette for high contrast */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,rgba(0,0,0,0.1)_0%,rgba(10,8,5,0.55)_78%,rgba(5,4,3,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Subtle Skip button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-10 px-4 py-2 text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' }}
      >
        Skip
      </button>
    </div>
  )
}
