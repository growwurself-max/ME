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
            ? 'glass-nav-scrolled shadow-[0_12px_40px_rgba(15,16,21,0.12),inset_0_1px_0_rgba(255,255,255,0.55)] border-white/20'
            : 'glass-nav bg-white/55 backdrop-blur-xl border-white/30 shadow-[0_8px_32px_rgba(15,16,21,0.08)]'
          }`}
        style={{
          backdropFilter: 'blur(18px) saturate(1.45)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.45)',
        }}
      >
        <a href="#top" className="font-display text-[17px] tracking-wide shrink-0" data-magnetic="HOME">
          Mokshaa <span className="gold-gradient-text">Enterprises</span>
        </a>

        <ul className="hidden md:flex items-center gap-1.5">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                data-magnetic={label.toUpperCase()}
                className="rounded-full px-3.5 py-1.5 text-[13px] tracking-wide text-[#54504A] hover:text-[#1F1D1A] hover:bg-white/60 transition-colors"
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
            className="flex items-center gap-2 rounded-full bg-[#1F1D1A] px-5 py-2 text-sm text-white hover:bg-black transition-colors shadow-md"
          >
            <Phone size={15} /> {CONTACT.phones[0]}
          </MagneticButton>
        </div>

        <button
          className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-white/70 border border-white/40 text-[#1F1D1A]"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-x-4 top-[68px] rounded-[20px] glass-nav-scrolled border border-white/20 p-2 shadow-xl md:hidden animate-in">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-full px-4 py-3 text-sm text-[#54504A] hover:bg-white/60 hover:text-[#1F1D1A] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
