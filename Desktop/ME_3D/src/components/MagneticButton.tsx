import { useRef, type ReactNode, type MouseEvent } from 'react'
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

  const onMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    gsap.to(el, {
      x: x * 0.25,
      y: y * 0.25,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
  const onLeave = () => {
    if (ref.current) gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.3)',
    })
  }

  const finalOnMouseEnter = (e: MouseEvent) => {
    onMove(e)
    if (onMouseEnter) onMouseEnter(e)
  }

  const finalOnMouseLeave = (e: MouseEvent) => {
    onLeave()
    if (onMouseLeave) onMouseLeave(e)
  }

  if (href) {
    return (
      <a
        ref={ref as never}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        data-magnetic={label}
        className={className}
        style={style}
        onMouseMove={onMove}
        onMouseEnter={finalOnMouseEnter}
        onMouseLeave={finalOnMouseLeave}
      >
        {children}
      </a>
    )
  }
  return (
    <button
      ref={ref as never}
      data-magnetic={label}
      className={className}
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