import { MessageCircle, Calculator } from 'lucide-react'
import { buildWhatsAppLink, useActiveProduct } from '../lib/activeProduct'
import MagneticButton from './MagneticButton'

export default function WhatsAppActions({ onQuote }: { onQuote: () => void }) {
  const active = useActiveProduct()
  const waHref = buildWhatsAppLink(active?.name)

  return (
    <>
      <MagneticButton
        href={waHref}
        label="CHAT"
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/30" />
        <MessageCircle size={26} className="relative" />
      </MagneticButton>
      <MagneticButton
        onClick={onQuote}
        label="QUOTE"
        className="fixed bottom-24 right-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 glass text-gold hover:bg-gold hover:text-charcoal transition-colors"
      >
        <Calculator size={20} />
      </MagneticButton>
    </>
  )
}