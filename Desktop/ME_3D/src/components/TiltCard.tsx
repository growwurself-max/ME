import { useEffect, useRef, type ReactNode } from 'react'

export default function TiltCard({
  children,
  className = '',
  maxTilt = 9,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useRef({ rx: 0, ry: 0, trx: 0, try_: 0, raf: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    const s = state.current

    const loop = () => {
      s.rx += (s.trx - s.rx) * 0.12
      s.ry += (s.try_ - s.ry) * 0.12
      el.style.transform = `perspective(1000px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`
      s.raf = requestAnimationFrame(loop)
    }
    loop()

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      s.trx = -py * maxTilt * 2
      s.try_ = px * maxTilt * 2
    }
    const onLeave = () => {
      s.trx = 0
      s.try_ = 0
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(s.raf)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [maxTilt])

  return (
    <div ref={ref} className={`will-change-transform ${className}`} style={{ transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  )
}
