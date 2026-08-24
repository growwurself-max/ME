import { useEffect, useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CollectionShowcase from './components/CollectionShowcase'
import Gallery from './components/Gallery'
import CraftsmanshipStory from './components/CraftsmanshipStory'
import ContactFooter from './components/ContactFooter'
import QuoteModal from './components/QuoteModal'
import WhatsAppActions from './components/WhatsAppActions'
import CursorFollower from './components/CursorFollower'
import { useSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const { lenis, gsap, ScrollTrigger } = useSmoothScroll()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const openQuote = useCallback(() => setQuoteOpen(true), [])

  // Sync Lenis with GSAP ticker on every frame
  useEffect(() => {
    const raf = (time: number) => {
      lenis.current?.raf(time * 1000)
      requestAnimationFrame(raf)
    }

    gsap.ticker.add(raf)

    return () => {
      gsap.ticker.remove(raf)
    }
  }, [lenis])

  return (
    <div className="relative">
      <CursorFollower />
      <Navbar />
      <main>
        <Hero />
        <CollectionShowcase />
        <Gallery />
        <CraftsmanshipStory />
        <ContactFooter onQuote={openQuote} />
      </main>
      <WhatsAppActions onQuote={openQuote} />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  )
}
