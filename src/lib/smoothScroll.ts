import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.defaults({ scroller: window })

let lenisInstance: Lenis | null = null
let refCount = 0

/**
 * useSmoothScroll — butter-smooth momentum via Lenis + GSAP ScrollTrigger sync
 * - Singleton: safe to call in multiple components
 * - Respects prefers-reduced-motion (falls back to native)
 * - Syncs Lenis → ScrollTrigger every tick
 * 
 * Usage:
 *   useSmoothScroll() // in App.tsx once
 */
export function useSmoothScroll(opts?: { duration?: number; lerp?: number }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    refCount++
    if (!lenisInstance) {
      lenisInstance = new Lenis({
        duration: opts?.duration ?? 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
        smoothWheel: true,
        syncTouch: false, // keep native touch momentum
        touchMultiplier: 1.6,
        gestureOrientation: 'vertical',
        wrapper: window as any,
        content: document.documentElement as any,
      })

      // Lenis → GSAP sync
      lenisInstance.on('scroll', ScrollTrigger.update)

      const raf = (time: number) => {
        lenisInstance?.raf(time * 1000)
      }
      gsap.ticker.add(raf)
      ;(gsap.ticker as any).lagSmoothing(0)
      lenisInstance.start()

      const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120)
      ;(lenisInstance as any)._cleanup = () => {
        gsap.ticker.remove(raf)
        clearTimeout(refreshTimer)
      }

      // Refresh on font load / resize
      const onResize = () => ScrollTrigger.refresh()
      window.addEventListener('resize', onResize)
      ;(lenisInstance as any)._onResize = onResize
    }

    lenisRef.current = lenisInstance

    return () => {
      refCount--
      if (refCount === 0 && lenisInstance) {
        const inst: any = lenisInstance
        inst._cleanup?.()
        if (inst._onResize) window.removeEventListener('resize', inst._onResize)
        lenisInstance.destroy()
        lenisInstance = null
      }
      lenisRef.current = null
    }
  }, [opts?.duration])

  return { lenis: lenisRef, gsap, ScrollTrigger }
}

/**
 * Helper: scroll to anchor with Lenis (falls back to native)
 */
export function scrollTo(target: string | number, offset = 0) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target as any, { offset, duration: 1.2 })
  } else {
    if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
    else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  }
}

export { gsap, ScrollTrigger }
