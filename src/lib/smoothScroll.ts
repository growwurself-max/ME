import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Ensure ScrollTrigger uses window as scroller (not a proxy)
ScrollTrigger.defaults({ scroller: window })

export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
      requestAnimationFrame(raf)
    }

    gsap.ticker.add(raf)

    // Start Lenis explicitly
    lenis.start()

    // Refresh ScrollTrigger after a brief delay to ensure layout is settled
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      clearTimeout(refreshTimer)
    }
  }, [])

  return { lenis: lenisRef, gsap, ScrollTrigger }
}

export { gsap, ScrollTrigger }