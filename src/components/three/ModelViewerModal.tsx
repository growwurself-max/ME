import { useEffect, useState } from 'react'
import { X, RotateCcw, Smartphone, Sun, Moon, Maximize2 } from 'lucide-react'
import Furniture3DViewer from './Furniture3DViewer'
import type { Finish, Product } from '../../data/products'

export default function ModelViewerModal({
  product,
  finish,
  onFinishChange,
  onClose,
}: {
  product: Product
  finish: Finish
  onFinishChange: (f: Finish) => void
  onClose: () => void
}) {
  const [bright, setBright] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal/95 backdrop-blur-xl flex flex-col animate-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/15">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted uppercase">Inspect in 3D</p>
          <h3 className="font-display text-2xl">{product.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBright((b) => !b)}
            title="Toggle lighting"
            className="p-2.5 rounded-full border border-gold/30 text-cream hover:bg-gold hover:text-charcoal transition-colors"
          >
            {bright ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => window.location.reload()}
            title="Reset view"
            className="hidden sm:block p-2.5 rounded-full border border-gold/30 text-cream hover:bg-gold hover:text-charcoal transition-colors"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={enterFullscreen}
            title="Fullscreen"
            className="hidden sm:block p-2.5 rounded-full border border-gold/30 text-cream hover:bg-gold hover:text-charcoal transition-colors"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-gold text-charcoal hover:scale-105 transition-transform"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`relative flex-1 ${bright ? '' : 'brightness-75'} transition-all`}>
        <Furniture3DViewer product={product} finish={finish} showHotspots />
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          <span className="glass rounded-full px-5 py-2 text-xs tracking-widest text-muted uppercase flex items-center gap-2">
            <Smartphone size={14} className="text-gold" /> Drag to rotate · Scroll to zoom
          </span>
        </div>
      </div>

      <div className="border-t border-gold/15 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs tracking-widest text-muted uppercase">Finish</span>
          {product.finishes.map((f) => (
            <button
              key={f.name}
              onClick={() => onFinishChange(f)}
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 border transition-all ${
                finish.name === f.name ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: f.color }} />
              <span className="text-sm">{f.name}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-gold font-medium">{product.priceRange}</span>
            <a
              href={`https://wa.me/919603077444?text=${encodeURIComponent(
                `Hi Mokshaa Enterprises, I'm interested in the ${product.name} (${finish.name}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gold px-5 py-2 text-charcoal text-sm font-semibold hover:scale-105 transition-transform"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
