import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Ensure ScrollTrigger uses window as scroller (not a proxy)
ScrollTrigger.defaults({ scroller: window })

// Singleton Lenis instance to ensure only one exists across the app
let lenisInstance: Lenis | null = null
let refCount = 0

export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Increment reference count
    refCount++

    // Create Lenis instance only if it doesn't exist
    if (!lenisInstance) {
      lenisInstance = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Use native window scroll (not a virtual container)
        wrapper: window,
        content: document.documentElement,
      })

      lenisInstance.on('scroll', ScrollTrigger.update)

      const raf = (time: number) => {
        lenisInstance?.raf(time * 1000)
      }

      gsap.ticker.add(raf)

      // Start Lenis explicitly
      lenisInstance.start()

      // Refresh ScrollTrigger after a brief delay to ensure layout is settled
      const refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh()
      }, 100)

      // Store cleanup function on the instance for later
      ;(lenisInstance as any)._cleanup = () => {
        gsap.ticker.remove(raf)
        clearTimeout(refreshTimer)
      }
    }

    lenisRef.current = lenisInstance

    return () => {
      // Decrement reference count
      refCount--

      // Only destroy when no components are using it
      if (refCount === 0 && lenisInstance) {
        ;(lenisInstance as any)._cleanup?.()
        lenisInstance.destroy()
        lenisInstance = null
      }

      lenisRef.current = null
    }
  }, [])

  return { lenis: lenisRef, gsap, ScrollTrigger }
}

export { gsap, ScrollTrigger }