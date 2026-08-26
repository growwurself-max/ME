import { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { ArrowDown, Sparkles } from 'lucide-react'
import MagneticButton from './MagneticButton'
import { LightSimulator } from './three/Furniture3DViewer'

const HeroScene = lazy(() => import('./three/HeroScene'))

export default function Hero() {
  const [lightMode, setLightMode] = useState(0.5)
  const [videoError, setVideoError] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      console.log('[Hero] Video ended')
      video.style.pointerEvents = 'none'
      setVideoEnded(true)
      // Ensure scroll is unlocked when video ends
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }

    const handleError = (e: Event) => {
      console.error('[Hero] Video error:', e)
      setVideoError(true)
      setVideoEnded(true)
      video.style.pointerEvents = 'none'
      // Ensure scroll is unlocked on error
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
    }

    const handleCanPlay = () => {
      console.log('[Hero] Video can play')
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('canplay', handleCanPlay)

    safetyTimeoutRef.current = setTimeout(() => {
      if (video.readyState < 2) {
        console.warn('[Hero] Video safety timeout - autoplay likely blocked')
        setVideoError(true)
        setVideoEnded(true)
        video.style.pointerEvents = 'none'
        // Ensure scroll is unlocked on timeout
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }, 5000)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('canplay', handleCanPlay)
      video.style.pointerEvents = 'none'
      // Ensure scroll is unlocked on cleanup
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <>
      {/* Scroll track container - provides actual scroll height for 3D scene progress calculation */}
      <div id="scroll-track" className="h-[500vh] w-full pointer-events-none relative" aria-hidden="true" />
      
      <section id="top" className="relative h-[100svh] min-h-[620px] overflow-hidden fixed inset-0 z-0">
        {/* Video background - plays as cinematic opening */}
        {!videoError && (
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 object-cover w-full h-full z-[-1]"
            aria-hidden="true"
          />
        )}
        
        {/* 3D Showroom Canvas - renders ON TOP of video, below UI */}
        <Suspense fallback={null}>
          {(videoEnded || videoError) && <HeroScene lightMode={lightMode} />}
        </Suspense>

        {/* UI Overlay Content */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-8 sm:py-12 md:py-20 text-center z-10 px-4 sm:px-0">
          <div className="mt-4 sm:mt-6 md:mt-8 flex-1 flex flex-col items-center justify-center min-h-0">
            <p className="mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm tracking-[0.3em] sm:tracking-[0.4em] text-brass uppercase">
              <Sparkles size={12} className="sm:size-14 md:size-[16px]" /> Since Hyderabad · Est. Craftsmanship
            </p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-tight tracking-tight mb-2 sm:mb-3 px-2 sm:px-4" style={{ color: '#1F1D1A' }}>
              Crafting Comfort
              <br />
              <span className="italic gold-gradient-text">for Every Space</span>
            </h1>
          </div>

          <div className="pointer-events-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-6 w-full max-w-md px-3 sm:px-4 pb-16 sm:pb-20 md:pb-12">
            <p className="text-xs sm:text-sm md:text-base leading-relaxed px-1 sm:px-2" style={{ color: '#54504A' }}>
              Luxury sofas, cots, dining sets & mattresses — custom-built with premium hardwood and
              factory-direct pricing. Scroll to enter the 3D showroom.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 w-full">
              <MagneticButton
                href="#collection"
                label="EXPLORE"
                className="rounded-full px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 text-white font-semibold transition-colors w-full sm:w-auto text-xs sm:text-sm md:text-base"
                style={{ backgroundColor: '#8C6D48' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#775A38'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#8C6D48'}
              >
                Explore Collection
              </MagneticButton>
              <MagneticButton
                href="#quote"
                label="QUOTE"
                className="rounded-full border backdrop-blur-md px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 font-medium transition-colors w-full sm:w-auto text-xs sm:text-sm md:text-base"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(130, 115, 95, 0.25)', color: '#1F1D1A' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8C6D48'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(130, 115, 95, 0.25)'}
              >
                Get a Quote
              </MagneticButton>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-5 left-1/2 z-20 -translate-x-1/2 animate-bounce text-slate/70 hidden sm:block">
          <ArrowDown size={16} className="sm:size-[18px]" />
        </div>

        {/* Floating day-to-night lighting simulator over the showroom canvas */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-3 sm:left-4 md:left-6 z-20 hidden sm:block">
          <LightSimulator mode={lightMode} onChange={setLightMode} />
        </div>
      </section>
    </>
  )
}
