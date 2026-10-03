import { useEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'

export default function RevealText({
  text,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  style,
}: {
  text: string
  as?: keyof JSX.IntrinsicElements
  className?: string
  delay?: number
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll('.reveal-word > span')
    gsap.set(words, { yPercent: 110 })
    const tween = gsap.to(words, {
      yPercent: 0,
      stagger: 0.06,
      delay,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [text, delay])

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="reveal-word">
          <span>{w}&nbsp;</span>
        </span>
      ))}
    </Tag>
  )
}
