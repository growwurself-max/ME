import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Box, Maximize, Move3d } from 'lucide-react'
import { CATEGORIES, FINISH_PRESETS, PRODUCTS, type Finish, type Product } from '../data/products'
import ModelViewerModal from './three/ModelViewerModal'
import RevealText from './RevealText'
import TiltCard from './TiltCard'
import { gsap, ScrollTrigger } from '../lib/smoothScroll'

const Furniture3DViewer = lazy(() => import('./three/Furniture3DViewer'))

function PanelCanvas({ product }: { product: Product }) {
  const holder = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={holder} className="h-full w-full">
      {visible && (
        <Suspense fallback={null}>
          <Furniture3DViewer product={product} finish={FINISH_PRESETS.ivoryLinen} showHotspots={false} />
        </Suspense>
      )}
      {!visible && (
        <div className="flex h-full items-center justify-center text-oat">
          <Box size={64} strokeWidth={1} />
        </div>
      )}
    </div>
  )
}

export default function CollectionShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [finish, setFinish] = useState<Finish>(FINISH_PRESETS.velvetEmerald)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const ctx = gsap.context(() => {
      const getDistance = () => track.scrollWidth - window.innerWidth
      const horizTween = gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      gsap.utils.toArray<HTMLElement>('.panel-bg').forEach((bg) => {
        gsap.fromTo(bg, { xPercent: -10 }, {
          xPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: bg,
            containerAnimation: horizTween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        })
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* Horizontal showroom walkthrough — pinned GSAP ScrollTrigger */}
      <section ref={sectionRef} id="collection" className="relative h-screen overflow-hidden" style={{ backgroundColor: 'rgba(245, 239, 235, 0.6)' }}>
        <h2 className="sr-only">Our Collection</h2>
        <div ref={trackRef} className="flex h-full w-max items-stretch">
          {CATEGORIES.map((cat, i) => {
            const product = PRODUCTS.find((p) => p.category === cat.id)!
            return (
              <article key={cat.id} className="panel relative flex h-full w-screen shrink-0 items-center overflow-hidden px-6">
                <div className="panel-bg absolute inset-0 flex items-center justify-end pr-8 text-oat opacity-60 pointer-events-none select-none">
                  <span className="font-display text-[38vh] leading-none whitespace-nowrap">{`0${i + 1}`}</span>
                </div>

                <div className="relative z-10 w-full max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Column - 3D Viewer */}
                    <div className="order-1 lg:order-1 lg:col-span-7">
                      <div className="h-[440px] cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden relative shadow-sm" style={{ backgroundColor: '#ECE7E1', border: '1px solid rgba(130, 115, 95, 0.2)' }}>
                        <PanelCanvas product={product} />
                        <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] tracking-widest uppercase" style={{ backgroundColor: 'rgba(232, 227, 220, 0.8)', backdropFilter: 'blur(12px) saturate(1.2)', WebkitBackdropFilter: 'blur(12px) saturate(1.2)', border: '1px solid #D5CEC4', color: '#54504A' }}>
                          <Move3d size={12} className="text-brass" /> 360° Drag
                        </span>
                      </div>
                    </div>

                    {/* Right Column - Product Details */}
                    <div className="order-2 lg:order-2 lg:col-span-5 w-full pr-4">
                      <p className="text-xs tracking-[0.35em] uppercase" style={{ color: '#9E7B56' }}>{`0${i + 1} — ${cat.label}`}</p>
                      <h3 className="mt-3 font-display text-3xl lg:text-4xl leading-tight font-medium" style={{ color: '#1F1D1A' }}>{product.name}</h3>
                      <p className="mt-1 text-base italic" style={{ color: '#8C6D48' }}>{product.tagline}</p>
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: '#54504A' }}>{product.description}</p>
                      
                      {/* Specs Grid */}
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(130, 115, 95, 0.15)' }}>
                          <span className="text-sm" style={{ color: '#54504A' }}>Dimensions</span>
                          <span className="text-sm font-medium" style={{ color: '#1F1D1A' }}>{product.dimensions.width} × {product.dimensions.depth} × {product.dimensions.height} cm</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(130, 115, 95, 0.15)' }}>
                          <span className="text-sm" style={{ color: '#54504A' }}>Warranty</span>
                          <span className="text-sm font-medium" style={{ color: '#1F1D1A' }}>{product.warranty}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(130, 115, 95, 0.15)' }}>
                          <span className="text-sm" style={{ color: '#54504A' }}>Price</span>
                          <span className="text-sm font-medium" style={{ color: '#1F1D1A' }}>{product.priceRange}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFinish(product.finishes[0])
                          setSelected(product)
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors w-full justify-center"
                        style={{ borderColor: 'rgba(184, 142, 82, 0.5)', color: '#A3704C' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B88E52'; e.currentTarget.style.color = '#FFFFFF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A3704C'; }}
                      >
                        <Maximize size={16} /> Inspect in 3D
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Full catalog grid — magnetic tilt cards */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <RevealText
          text="The Complete Catalogue"
          className="font-display text-4xl sm:text-5xl mb-14"
          style={{ color: '#1F1D1A' }}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: '1400px' }}>
          {PRODUCTS.map((p) => (
            <TiltCard key={p.id}>
              <div
                onClick={() => {
                  setFinish(p.finishes[0])
                  setSelected(p)
                }}
                className="group cursor-pointer rounded-2xl card-lux p-6 hover:border-brass/40 transition-[border-color,box-shadow] duration-300 hover:shadow-studio-lg"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs tracking-widest text-brass uppercase">{CATEGORIES.find((c) => c.id === p.category)?.label}</p>
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(232, 227, 220, 0.8)', backdropFilter: 'blur(12px) saturate(1.2)', WebkitBackdropFilter: 'blur(12px) saturate(1.2)', border: '1px solid #D5CEC4', color: '#54504A' }}>
                    <Move3d size={11} /> 360°
                  </span>
                </div>
                <h3 className="mt-2 font-display text-2xl" style={{ color: '#1F1D1A' }}>{p.name}</h3>
                <p className="mt-2 text-sm" style={{ color: '#54504A' }}>{p.tagline}</p>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-brass/40 to-transparent" />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate">{p.priceRange}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFinish(p.finishes[0])
                      setSelected(p)
                    }}
                    className="text-sm text-teak opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Inspect →
                  </button>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {selected && (
        <ModelViewerModal
          product={selected}
          finish={finish}
          onFinishChange={setFinish}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
