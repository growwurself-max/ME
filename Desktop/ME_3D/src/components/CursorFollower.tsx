import { useEffect, useRef } from 'react'

export default function CursorFollower() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const ringPos = { ...pos }
    let mode = 'default'

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = e.target as HTMLElement
      const canvas = t.closest('canvas')
      const magnetic = t.closest('[data-magnetic]')
      if (label.current) {
        const want = canvas ? '360° · DRAG' : magnetic ? (magnetic.getAttribute('data-magnetic') || '') : ''
        if (want !== mode) {
          mode = want
          label.current.textContent = want
          label.current.style.opacity = want ? '1' : '0'
        }
      }
      if (ring.current) {
        ring.current.style.borderColor = canvas || magnetic ? '#B88E52' : 'rgba(24, 24, 27, 0.18)'
        ring.current.style.transform += ''
      }
    }

    let rafId: number
    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.16
      ringPos.y += (pos.y - ringPos.y) * 0.16
      if (dot.current) dot.current.style.transform = `translate(${pos.x - 3}px, ${pos.y - 3}px)`
      if (ring.current)
        ring.current.style.transform = `translate(${ringPos.x - 22}px, ${ringPos.y - 22}px)`
      rafId = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div className="hidden md:block">
      <div ref={dot} className="fixed top-0 left-0 z-[200] pointer-events-none h-1.5 w-1.5 rounded-full bg-gold" />
      <div
        ref={ring}
        className="fixed top-0 left-0 z-[199] pointer-events-none h-11 w-11 rounded-full border flex items-center justify-center transition-[border-color] duration-300"
        style={{ borderColor: 'rgba(24, 24, 27, 0.18)' }}
      >
        <span
          ref={label}
          className="text-[8px] tracking-[0.2em] text-teak whitespace-nowrap opacity-0 transition-opacity duration-200"
        />
      </div>
    </div>
  )
}
