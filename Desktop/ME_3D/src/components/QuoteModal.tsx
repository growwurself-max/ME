import { useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { CATEGORIES, CONTACT } from '../data/products'

export default function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0].label)
  const [width, setWidth] = useState('')
  const [depth, setDepth] = useState('')
  const [height, setHeight] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const summary =
    `Hi Mokshaa Enterprises! I'd like a custom quote.\n` +
    `• Category: ${category}\n` +
    (width ? `• Width: ${width} cm\n` : '') +
    (depth ? `• Depth: ${depth} cm\n` : '') +
    (height ? `• Height: ${height} cm\n` : '') +
    (notes ? `• Notes: ${notes}\n` : '')

  const waLink = `https://wa.me/919603077444?text=${encodeURIComponent(summary)}`
  const mailLink = `mailto:${CONTACT.emails[0]}?subject=${encodeURIComponent(
    'Custom Furniture Quote Request'
  )}&body=${encodeURIComponent(summary)}`

  const field =
    'w-full rounded-xl border border-oat bg-white px-4 py-3 text-sm text-obsidian placeholder-slate/60 outline-none focus:border-brass/60 transition-colors'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/30 backdrop-blur-md p-4 animate-in" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-oat bg-alabaster p-8 shadow-studio-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-brass uppercase">Custom Dimension Builder</p>
            <h3 className="mt-2 font-display text-3xl text-obsidian">Request a Quote</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate hover:text-teak" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input value={width} onChange={(e) => setWidth(e.target.value.replace(/\D/g, ''))} placeholder="Width cm" className={field} inputMode="numeric" />
            <input value={depth} onChange={(e) => setDepth(e.target.value.replace(/\D/g, ''))} placeholder="Depth cm" className={field} inputMode="numeric" />
            <input value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, ''))} placeholder="Height cm" className={field} inputMode="numeric" />
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Fabric / wood preferences, room details…" className={field} />
          <div className="flex gap-3 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              <Send size={16} /> WhatsApp Quote
            </a>
            <a
              href={mailLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-brass/50 py-3 text-sm font-semibold text-teak hover:bg-brass hover:text-white transition-colors"
            >
              Email Quote
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
