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
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'glass py-3' : 'py-6'}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <a href="#top" className="font-display text-xl tracking-wide">
          Mokshaa <span className="gold-gradient-text">Enterprises</span>
        </a>
        <ul className="hidden md:flex items-center gap-8">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <MagneticButton href={href} label="" className="text-sm text-slate hover:text-teak transition-colors tracking-wide">
                {label}
              </MagneticButton>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <MagneticButton
            href={`tel:${CONTACT.phones[0].replace(/\s/g, '')}`}
            label="CALL"
            className="flex items-center gap-2 rounded-full border border-brass/50 px-5 py-2 text-sm text-teak hover:bg-brass hover:text-white transition-colors"
          >
            <Phone size={15} /> {CONTACT.phones[0]}
          </MagneticButton>
        </div>
        <button className="md:hidden text-obsidian" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="glass md:hidden mt-3 px-6 py-4 space-y-4">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block text-slate hover:text-teak">
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
