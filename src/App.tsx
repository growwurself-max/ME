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
import IntroVideo from './components/IntroVideo'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSmoothScroll } from './lib/smoothScroll'

export default function App() {
  useSmoothScroll()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [heroSceneActive, setHeroSceneActive] = useState(false)
  const openQuote = useCallback(() => setQuoteOpen(true), [])

  // Mount the hero 3D scene only once the intro starts fading out, so video
  // playback and the heavy WebGL scene setup never block the main thread at
  // the same time. A long fallback guarantees the scene still appears if the
  // video never ends (autoplay blocked, load error, etc.).
  useEffect(() => {
    const activate = () => setHeroSceneActive(true)
    window.addEventListener('intro:start-exit', activate)
    const fallback = window.setTimeout(activate, 12000)
    return () => {
      window.removeEventListener('intro:start-exit', activate)
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <ErrorBoundary>
      <IntroVideo />
      <div className="relative">
        <CursorFollower />
        <Navbar />
        <main>
          <ErrorBoundary>
            <Hero sceneActive={heroSceneActive} />
          </ErrorBoundary>
          <CollectionShowcase />
          <Gallery />
          <CraftsmanshipStory />
          <ContactFooter onQuote={openQuote} />
        </main>
        <WhatsAppActions onQuote={openQuote} />
        <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      </div>
    </ErrorBoundary>
  )
}
