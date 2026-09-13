import { useState } from 'react'
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
  const openQuote = () => setQuoteOpen(true)

  return (
    <ErrorBoundary>
      <IntroVideo />
      <div className="relative min-h-screen bg-[#FAF8F5]">
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
      </div>
    </ErrorBoundary>
  )
}
