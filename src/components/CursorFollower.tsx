import { useEffect, useRef, useState } from 'react'

export default function CursorFollower() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(
    window.matchMedia('(pointer: coarse)').matches
  )

  useEffect(() => {
    const onResize = () => {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isTouchDevice) {
      let badge: HTMLDivElement | null = null
      let toggle: HTMLButtonElement | null = null

      const createBadge = () => {
        badge = document.createElement('div')
        badge.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-teak text-white text-sm font-medium shadow-lg z-[100] animate-in'
        badge.innerHTML = 'Tap to Rotate 3D'
        badge.style.display = 'block'
        badge.addEventListener('click', activate3DControls)
        document.body.appendChild(badge)
        return badge
      }

      const createToggleButton = () => {
        toggle = document.createElement('button')
        toggle.className = 'fixed top-4 right-4 z-[200] p-2 rounded-full bg-white/90 hover:bg-white text-espresso transition-colors shadow-lg'
        toggle.innerHTML = '<X size={24} />'
        toggle.addEventListener('click', deactivate3DControls)
        document.body.appendChild(toggle)
        return toggle
      }

      createBadge()
      createToggleButton()

      function activate3DControls() {
        if (badge) badge.style.display = 'none'
        if (toggle) toggle.style.display = 'block'
        document.body.style.overflow = 'hidden'
        window.dispatchEvent(new CustomEvent('3d-controls:activate'))
      }

      function deactivate3DControls() {
        if (badge) badge.style.display = 'block'
        if (toggle) toggle.style.display = 'none'
        document.body.style.overflow = ''
        window.dispatchEvent(new CustomEvent('3d-controls:deactivate'))
      }

      return () => {
        if (badge) document.body.removeChild(badge)
        if (toggle) document.body.removeChild(toggle)
      }
    }
  }, [isTouchDevice])

  useEffect(() => {
    if (isTouchDevice) return

    const onMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY }
      const t = e.target as HTMLElement
      const canvas = t.closest('canvas')
      const magnetic = t.closest('[data-magnetic]')
      if (label.current) {
        const want = canvas ? '360° · DRAG' : magnetic ? (magnetic.getAttribute('data-magnetic') || '') : ''
        if (want !== 'default') {
          label.current.textContent = want
          label.current.style.opacity = want ? '1' : '0'
        }
      }
      if (ring.current) {
        ring.current.style.borderColor = canvas || magnetic ? '#B88E52' : 'rgba(24, 24, 27, 0.18)'
        ring.current.style.transform += ''
      }
    }

    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const ringPos = { ...pos }
    let mode = 'default'

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
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [isTouchDevice])

  return (
    <div className={`hidden ${isTouchDevice ? 'md:block' : 'block'} md:hidden`}>
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