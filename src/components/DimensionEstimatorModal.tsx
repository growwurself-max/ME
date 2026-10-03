import { useState } from 'react'
import { X, Send } from 'lucide-react'

export default function DimensionEstimatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [width, setWidth] = useState('')
  const [depth, setDepth] = useState('')
  const [height, setHeight] = useState('')

  if (!isOpen) return null

  const whatsappNumber = '919603077444'
  const encodedText = (
    'Hi%20Mokshaa%20Enterprises,%20I%20am%20interested%20in%20custom%20furniture.%0A' +
    (width ? `Width:%20${width}%20cm%0A` : '') +
    (depth ? `Depth:%20${depth}%20cm%0A` : '') +
    (height ? `Height:%20${height}%20cm%0A` : '')
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-oat bg-alabaster p-8 shadow-studio-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-brass uppercase">Instant Dimension Estimator</p>
            <h3 className="mt-2 font-display text-2xl text-alabaster">Custom Furniture Sizing</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate hover:text-teak" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-4">
            <label className="text-sm text-teak uppercase mb-1">Width</label>
            <input
              value={width}
              onChange={(e) => setWidth(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g., 350"
              inputMode="numeric"
              className="w-full rounded-xl border border-oat bg-white px-4 py-3 text-sm text-alabaster placeholder-slate/60 outline-none focus:border-brass/60 transition-colors"
              style={{ marginBottom: '1rem' }}
            />
          </div>
          <div className="mb-4">
            <label className="text-sm text-teak uppercase mb-1">Depth</label>
            <input
              value={depth}
              onChange={(e) => setDepth(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g., 200"
              inputMode="numeric"
              className="w-full rounded-xl border border-oat bg-white px-4 py-3 text-sm text-alabaster placeholder-slate/60 outline-none focus:border-brass/60 transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="text-sm text-teak uppercase mb-1">Height</label>
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g., 90"
              inputMode="numeric"
              className="w-full rounded-xl border border-oat bg-white px-4 py-3 text-sm text-alabaster placeholder-slate/60 outline-none focus:border-brass/60 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodedText}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white hover:brightness-110 transition-colors"
            >
              <Send size={16} /> Send to WhatsApp
            </a>
            <a
              href="mailto:srinug41@gmail.com"
              className="flex-1 items-center justify-center gap-2 rounded-full border border-brass/50 py-3 text-sm font-semibold text-teak hover:bg-brass hover:text-white transition-colors"
            >
              Email Inquiry
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}