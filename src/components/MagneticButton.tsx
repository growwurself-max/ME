import { useRef, type ReactNode, type MouseEvent, useLayoutEffect } from 'react'
import gsap from 'gsap'

export default function MagneticButton({
  children,
  className = '',
  label = 'CLICK',
  onClick,
  href,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode
  className?: string
  label?: string
  onClick?: () => void
  href?: string
  style?: React.CSSProperties
  onMouseEnter?: (e: MouseEvent) => void
  onMouseLeave?: (e: MouseEvent) => void
}) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const ctxRef = useRef<gsap.Context | null>(null)

  useLayoutEffect(() => {
    ctxRef.current = gsap.context(() => {}, ref)
    return () => ctxRef.current?.revert()
  }, [])

  const onMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    gsap.to(el, {
      x: x * 0.28,
      y: y * 0.32,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: true,
    })
  }

  const onLeave = () => {
    if (!ref.current) return
    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.32)',
      overwrite: true,
    })
  }

  const finalOnMouseEnter = (e: MouseEvent) => {
    onMouseEnter?.(e)
  }
  const finalOnMouseLeave = (e: MouseEvent) => {
    onLeave()
    onMouseLeave?.(e)
  }

  if (href) {
    return (
      <a
        ref={ref as never}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        data-magnetic={label}
        className={`${className} inline-flex items-center justify-center will-change-transform`}
        style={style}
        onMouseMove={onMove}
        onMouseEnter={finalOnMouseEnter}
        onMouseLeave={finalOnMouseLeave}
      >
        {/* subtle shine on hover */}
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        {children}
      </a>
    )
  }
  return (
    <button
      ref={ref as never}
      data-magnetic={label}
      className={`${className} inline-flex items-center justify-center will-change-transform`}
      style={style}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={finalOnMouseEnter}
      onMouseLeave={finalOnMouseLeave}
    >
      {children}
    </button>
  )
}
