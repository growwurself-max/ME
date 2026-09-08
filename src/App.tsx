import { useState, Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CollectionShowcase from './components/CollectionShowcase'
import Gallery from './components/Gallery'
import CraftsmanshipStory from './components/CraftsmanshipStory'
import ContactFooter from './components/ContactFooter'
import QuoteModal from './components/QuoteModal'
import WhatsAppActions from './components/WhatsAppActions'
import CursorFollower from './components/CursorFollower'
import LoadingScreen from './components/LoadingScreen'
import GatewaySplash from './components/GatewaySplash'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSmoothScroll } from './lib/smoothScroll'

export default function App() {
  useSmoothScroll()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [entered, setEntered] = useState(() => sessionStorage.getItem('entered_showroom') === 'true')
  const openQuote = () => setQuoteOpen(true)

  const enterShowroom = () => {
    sessionStorage.setItem('entered_showroom', 'true')
    setEntered(true)
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-[#FAF8F5]">
        {!entered ? (
          <GatewaySplash onEnter={enterShowroom} />
        ) : (
          <>
            <Suspense fallback={null}>
              <LoadingScreen />
            </Suspense>
            <CursorFollower />
            <Navbar />
            <main className="min-h-screen">
              <ErrorBoundary>
                <Hero />
              </ErrorBoundary>
              <CollectionShowcase />
              <Gallery />
              <CraftsmanshipStory />
              <ContactFooter onQuote={openQuote} />
            </main>
            <WhatsAppActions onQuote={openQuote} />
            <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
