import { useEffect, useState } from 'react'
import { Menu, X, Phone } from 'lucide-react'
import MagneticButton from './MagneticButton'
import { CONTACT } from '../data/products'

const LINKS = [
  ['Collection', '#collection'],
  ['Gallery', '#gallery'],
  ['Craftsmanship', '#craft'],
  ['Locations', '#contact'],
  ['Get a Quote', '#quote'],
] as const

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 z-50 flex justify-center px-4 transition-all duration-500 ${scrolled ? 'top-3' : 'top-5'}`}
    >
      {/* Floating pill HUD */}
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full border px-5 py-2.5 md:px-7 md:py-3 transition-all duration-500
        ${scrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-[#EAE5DC] shadow-[0_12px_40px_rgba(35,33,32,0.10),inset_0_1px_0_rgba(255,255,255,0.7)]'
            : 'bg-[#FAF8F5]/80 backdrop-blur-md border-[#EAE5DC] shadow-[0_8px_32px_rgba(35,33,32,0.07)]'
          }`}
        style={{
          backdropFilter: 'blur(18px) saturate(1.45)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.45)',
        }}
      >
        <a href="#top" className="font-display text-[17px] tracking-wide shrink-0 text-[#232120]" data-magnetic="HOME">
          Mokshaa <span className="gold-gradient-text">Enterprises</span>
        </a>

        <ul className="hidden md:flex items-center gap-1.5">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                data-magnetic={label.toUpperCase()}
                className="rounded-full px-3.5 py-1.5 text-[13px] tracking-wide text-[#6B6864] hover:text-[#8C6D3F] hover:bg-[#FAF8F5] transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          <MagneticButton
            href={`tel:${CONTACT.phones[0].replace(/\s/g, '')}`}
            label="CALL"
            className="flex items-center gap-2 rounded-full bg-[#8C6D3F] px-5 py-2 text-sm text-white hover:bg-[#775A38] transition-colors shadow-md"
          >
            <Phone size={15} /> {CONTACT.phones[0]}
          </MagneticButton>
        </div>

        <button
          className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-[#FAF8F5]/80 border border-[#EAE5DC] text-[#232120]"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-x-4 top-[68px] rounded-[20px] bg-[#FAF8F5]/95 border border-[#EAE5DC] p-2 shadow-xl md:hidden animate-in backdrop-blur-md">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-full px-4 py-3 text-sm text-[#6B6864] hover:bg-[#FAF8F5] hover:text-[#8C6D3F] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
