import { useState, useRef, useLayoutEffect } from 'react'
import { ArrowDown, Sparkles, SkipForward } from 'lucide-react'
import { gsap, ScrollTrigger } from '../lib/smoothScroll'
import MagneticButton from './MagneticButton'
import { LightSimulator } from './three/Furniture3DViewer'
import HeroScene from './three/HeroScene'

export default function Hero() {
  const [lightMode, setLightMode] = useState(0.5)
  const [videoError, setVideoError] = useState(false)
  const [videoBuffering, setVideoBuffering] = useState(false)
  const [videoDone, setVideoDone] = useState(false)
  const [videoMounted, setVideoMounted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollTrackRef = useRef<HTMLDivElement>(null)

  // Reveal refs
  const heroRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  // Cinematic staggered reveal — runs after preloader:done or immediately if already done
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // initial states
      gsap.set('.hero-eyebrow', { yPercent: 110, opacity: 0 })
      gsap.set('.hero-title span', { yPercent: 110, opacity: 0 })
      gsap.set('.hero-desc', { yPercent: 20, opacity: 0 })
      gsap.set('.hero-ctas > *', { yPercent: 30, opacity: 0 })
      gsap.set(canvasWrapRef.current, { opacity: 0, scale: 1.04, filter: 'blur(10px)' })

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      tl.to('.hero-eyebrow', { yPercent: 0, opacity: 1, duration: 0.8 }, 0)
        .to('.hero-title span', { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 0.15)
        .to(canvasWrapRef.current, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' }, 0.2)
        .to('.hero-desc', { yPercent: 0, opacity: 1, duration: 0.7 }, 0.55)
        .to('.hero-ctas > *', { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, 0.68)

      const play = () => tl.play(0)

      // If preloader already done (no loading), play immediately — else wait for event
      const handler = () => play()
      window.addEventListener('preloader:done', handler, { once: true })

      // Fallback: if no preloader event within 1.6s (e.g. direct reload with cache), auto-play
      const fallback = setTimeout(() => {
        if (tl.progress() === 0) play()
      }, 1600)

      return () => {
        window.removeEventListener('preloader:done', handler)
        clearTimeout(fallback)
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  // Fade out + slide up hero typography as the user scrolls, so the product
  // cards from the collection walkthrough never collide with the headline.
  // Hero copy clears over the first 0→0.2 of the hero scroll range.
  useLayoutEffect(() => {
    const track = scrollTrackRef.current
    const copy = heroRef.current?.querySelector('.hero-copy')
    if (!track || !copy) return

    const tween = gsap.to(copy, {
      opacity: 0,
      yPercent: -80,
      filter: 'blur(10px)',
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: '+=22vh',
        scrub: 0.4,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  const releaseScroll = () => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }

  // Dismiss the overlay ONLY on 'ended' OR an explicit "Skip Intro" tap —
  // never on a timer, so the full ~10s intro always plays through.
  const finishIntro = () => {
    setVideoDone(true)
    releaseScroll()
    // Fully unmount only after the 1000ms fade completes.
    setTimeout(() => setVideoMounted(false), 1000)
  }

  const handleEnded = () => finishIntro()

  const handleSkip = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = video.duration || video.currentTime
    }
    finishIntro()
  }

  const handleWaiting = () => setVideoBuffering(true)
  const handleStalled = () => setVideoBuffering(true)
  const handleCanPlay = () => setVideoBuffering(false)

  const handleError = () => {
    setVideoError(true)
    setVideoDone(true)
    setVideoMounted(false)
    releaseScroll()
  }

  return (
    <>
      <div id="scroll-track" ref={scrollTrackRef} className="h-[500vh] w-full pointer-events-none relative" aria-hidden="true" />

      <section id="top" ref={heroRef} className="h-[100svh] min-h-[620px] overflow-hidden fixed inset-0 z-0 bg-[#FAF8F5]">
        {!videoError && videoMounted && (
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/intro_poster.jpg"
            onEnded={handleEnded}
            onWaiting={handleWaiting}
            onStalled={handleStalled}
            onCanPlay={handleCanPlay}
            onError={handleError}
            className={`absolute inset-0 object-cover w-full h-full z-[-1] transition-opacity duration-1000 ease-in-out ${videoDone ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-hidden="true"
          />
        )}

        {!videoError && !videoDone && (
          <button
            onClick={handleSkip}
            className="absolute top-24 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-[11px] tracking-[0.18em] uppercase text-[#7A5C32] backdrop-blur-md transition-colors hover:bg-[#7A5C32] hover:text-white"
          >
            <SkipForward size={13} /> Skip Intro
          </button>
        )}

        {!videoError && !videoDone && videoBuffering && (
          <div className="pointer-events-none absolute inset-0 z-[-1] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#B88E52]/30 border-t-[#B88E52]" />
              <span className="text-[11px] tracking-[0.24em] text-[#8C6D3F] uppercase">Preparing showroom</span>
            </div>
          </div>
        )}

        <div ref={canvasWrapRef} className="absolute inset-0 z-0">
          <HeroScene lightMode={lightMode} />
        </div>

        <div className="hero-copy pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-8 sm:py-12 md:py-20 text-center z-10 px-4 sm:px-0">
          <div className="mt-4 sm:mt-6 md:mt-8 flex-1 flex flex-col items-center justify-center min-h-0">
            <p className="hero-eyebrow mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-semibold uppercase overflow-hidden" style={{ color: '#7A5C32', letterSpacing: '0.25em' }}>
              <span className="inline-flex items-center gap-2"><Sparkles size={12} className="sm:size-14 md:size-[16px]" /> Since Hyderabad · Est. Craftsmanship</span>
            </p>
            <h1
              className="hero-title font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-[1.05] tracking-tight mb-2 sm:mb-3 px-2 sm:px-4 font-semibold overflow-hidden"
              style={{ color: '#141312' }}
            >
              <span className="inline-block overflow-hidden"><span className="inline-block">Crafting Comfort</span></span>
              <br />
              <span className="inline-block overflow-hidden"><span className="inline-block italic" style={{ color: '#141312' }}>for Every Space</span></span>
            </h1>
          </div>

          <div className="pointer-events-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-6 w-full max-w-md px-3 sm:px-4 pb-16 sm:pb-20 md:pb-12">
            <p className="hero-desc text-xs sm:text-sm md:text-base font-medium leading-relaxed px-1 sm:px-2 overflow-hidden" style={{ color: '#3D3B38' }}>
              <span className="inline-block">Luxury sofas, cots, dining sets & mattresses — custom-built with premium hardwood and factory-direct pricing.</span>
            </p>
            <div className="hero-ctas flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 w-full overflow-hidden">
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
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)', borderColor: 'rgba(130, 115, 95, 0.25)', color: '#1F1D1A' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8C6D48'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(130, 115, 95, 0.25)'}
              >
                Get a Quote
              </MagneticButton>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-5 left-1/2 z-20 -translate-x-1/2 animate-bounce text-[#7A5C32]/70 hidden sm:block">
          <ArrowDown size={16} className="sm:size-[18px]" />
        </div>

        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-3 sm:left-4 md:left-6 z-20 hidden sm:block">
          <LightSimulator mode={lightMode} onChange={setLightMode} />
        </div>
      </section>
    </>
  )
}
