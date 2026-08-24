import { Suspense, lazy, useState } from 'react'
import { ArrowDown, Sparkles } from 'lucide-react'
import MagneticButton from './MagneticButton'
import { LightSimulator } from './three/Furniture3DViewer'

const HeroScene = lazy(() => import('./three/HeroScene'))

export default function Hero() {
  const [lightMode, setLightMode] = useState(0.5)

  return (
    <section id="top" className="relative h-[100svh] min-h-[620px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#FFFFFF_0%,#FAF8F5_45%,#F2EDE4_100%)]" />
      <Suspense fallback={null}>
        <HeroScene lightMode={lightMode} />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-20 text-center">
        <div className="mt-8">
          <p className="mb-3 flex items-center justify-center gap-2 text-xs tracking-[0.4em] text-brass uppercase">
            <Sparkles size={13} /> Since Hyderabad · Est. Craftsmanship
          </p>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-tight tracking-tight mb-2" style={{ color: '#1F1D1A' }}>
            Crafting Comfort
            <br />
            <span className="italic gold-gradient-text">for Every Space</span>
          </h1>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-6">
          <p className="max-w-md text-sm leading-relaxed px-6" style={{ color: '#54504A' }}>
            Luxury sofas, cots, dining sets & mattresses — custom-built with premium hardwood and
            factory-direct pricing. Scroll to enter the 3D showroom.
          </p>
          <div className="flex gap-4">
<MagneticButton
  href="#collection"
  label="EXPLORE"
  className="rounded-full px-8 py-3.5 text-white font-semibold transition-colors"
  style={{ backgroundColor: '#8C6D48' }}
  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#775A38'}
  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#8C6D48'}
>
              Explore Collection
            </MagneticButton>
<MagneticButton
  href="#quote"
  label="QUOTE"
  className="rounded-full border backdrop-blur-md px-8 py-3.5 font-medium transition-colors"
  style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(130, 115, 95, 0.25)', color: '#1F1D1A' }}
  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8C6D48'}
  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(130, 115, 95, 0.25)'}
            >
              Get a Quote
            </MagneticButton>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 animate-bounce text-slate/70">
        <ArrowDown size={18} />
      </div>

      {/* Floating day-to-night lighting simulator over the showroom canvas */}
      <div className="absolute bottom-8 left-6 z-20 hidden sm:block">
        <LightSimulator mode={lightMode} onChange={setLightMode} />
      </div>
    </section>
  )
}
