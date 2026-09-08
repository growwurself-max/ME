import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Magnetic Cursor — production ready
 * - Outer wrapper handles POSITION (x/y via transform)
 * - Inner circle handles SCALE/BORDER (gsap scale, borderColor, bg)
 * → no transform conflict, 60fps
 * - Snaps to [data-magnetic] | a | button | canvas (3D nodes)
 */
export default function CursorFollower() {
  const dotOuter = useRef<HTMLDivElement>(null)
  const ringOuter = useRef<HTMLDivElement>(null)
  const ringInner = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  const pos = useRef({ x: typeof window !== 'undefined' ? innerWidth / 2 : 0, y: typeof window !== 'undefined' ? innerHeight / 2 : 0 })
  const ringPos = useRef({ x: pos.current.x, y: pos.current.y })
  const magneticTarget = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number>(0)

  const [isCoarse, setIsCoarse] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  )
  const [mobileActive, setMobileActive] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)')
    const onChange = () => setIsCoarse(mql.matches)
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else (mql as any).addListener(onChange)
    window.addEventListener('resize', () => setIsCoarse(window.matchMedia('(pointer: coarse)').matches))
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else (mql as any).removeListener(onChange)
    }
  }, [])

  useEffect(() => {
    const onActivate = () => setMobileActive(true)
    const onDeactivate = () => setMobileActive(false)
    window.addEventListener('3d-controls:activate', onActivate)
    window.addEventListener('3d-controls:deactivate', onDeactivate)
    return () => {
      window.removeEventListener('3d-controls:activate', onActivate)
      window.removeEventListener('3d-controls:deactivate', onDeactivate)
    }
  }, [])

  useEffect(() => {
    if (isCoarse) return
    const dot = dotOuter.current!
    const outer = ringOuter.current!
    const inner = ringInner.current!
    const label = labelRef.current!
    if (!dot || !outer || !inner) return

    const enterMagnetic = (el: HTMLElement) => {
      magneticTarget.current = el
      const isCanvas = el.tagName === 'CANVAS'
      const txt = isCanvas ? '360° · DRAG' : (el.getAttribute('data-magnetic') || el.getAttribute('aria-label') || 'VIEW')
      label.textContent = txt
      gsap.to(label, { opacity: 1, duration: 0.18, overwrite: true })
      gsap.to(inner, { scale: 1.42, borderColor: '#B88E52', backgroundColor: 'rgba(184,142,82,0.13)', duration: 0.36, ease: 'power3.out', overwrite: true })
      gsap.to(dot, { scale: 1.9, duration: 0.3, ease: 'power3.out', overwrite: true })
    }
    const leaveMagnetic = () => {
      magneticTarget.current = null
      gsap.to(label, { opacity: 0, duration: 0.14, overwrite: true })
      gsap.to(inner, { scale: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(0,0,0,0)', duration: 0.42, ease: 'power3.out', overwrite: true })
      gsap.to(dot, { scale: 1, duration: 0.38, ease: 'power3.out', overwrite: true })
    }

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
      const t = e.target as HTMLElement
      const found =
        t.closest<HTMLElement>('[data-magnetic]') ||
        t.closest<HTMLElement>('a, button') ||
        (t.closest('canvas') as unknown as HTMLElement)
      if (found && found !== magneticTarget.current) enterMagnetic(found)
      else if (!found && magneticTarget.current) leaveMagnetic()
    }

    const onLeave = () => gsap.to([dot, outer], { opacity: 0, duration: 0.22, overwrite: true })
    const onEnter = () => gsap.to([dot, outer], { opacity: 1, duration: 0.18, overwrite: true })

    const loop = () => {
      if (magneticTarget.current && magneticTarget.current.tagName !== 'CANVAS') {
        const r = magneticTarget.current.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        ringPos.current.x += (cx - ringPos.current.x) * 0.17
        ringPos.current.y += (cy - ringPos.current.y) * 0.17
      } else {
        ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.14
        ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.14
      }
      outer.style.transform = `translate(${ringPos.current.x - 22}px, ${ringPos.current.y - 22}px)`
      dot.style.transform = `translate(${pos.current.x - 3}px, ${pos.current.y - 3}px)`
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('mouseenter', onEnter)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mouseenter', onEnter)
    }
  }, [isCoarse])

  if (isCoarse) {
    return (
      <>
        {!mobileActive ? (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('3d-controls:activate'))}
            className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#8C6D3F] px-5 py-2.5 text-xs tracking-[0.18em] text-white shadow-xl backdrop-blur-md border border-[#775A38]"
          >
            TAP TO ROTATE 3D
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('3d-controls:deactivate'))}
            className="fixed top-4 right-4 z-[80] rounded-full bg-[#8C6D3F] p-3 text-white shadow-xl backdrop-blur"
            aria-label="Exit 3D controls"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </>
    )
  }

  return (
    <div className="hidden lg:block pointer-events-none">
      <div ref={dotOuter} className="fixed top-0 left-0 z-[200] h-[6px] w-[6px] rounded-full bg-[#B88E52] will-change-transform" />
      <div ref={ringOuter} className="fixed top-0 left-0 z-[199] h-11 w-11 will-change-transform">
        <div
          ref={ringInner}
          className="h-full w-full rounded-full border flex items-center justify-center"
          style={{ borderColor: 'rgba(255,255,255,0.22)', background: 'transparent' }}
        >
          <span ref={labelRef} className="text-[8px] tracking-[0.2em] text-[#B88E52] whitespace-nowrap opacity-0 font-medium" />
        </div>
      </div>
    </div>
  )
}
