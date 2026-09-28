import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useSmoothScroll() {
  // Disable smooth scroll entirely to ensure basic scrolling works
  // This is a critical fix for touch devices and basic navigation
  useEffect(() => {
    // Ensure native scrolling works
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.body.style.overscrollBehavior = 'auto'
    
    return () => {}
  }, [])

  return { lenis: { current: null }, gsap, ScrollTrigger }
}

export { gsap, ScrollTrigger }