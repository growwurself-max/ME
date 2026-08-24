import { Layers, Hammer, Truck, ShieldCheck, Ruler } from 'lucide-react'
import RevealText from './RevealText'

const PILLARS = [
  { icon: Ruler, title: 'Custom Dimensions', body: 'Every piece made to your room’s exact measurements — no compromises.' },
  { icon: Layers, title: 'Premium Foam & Hardwood', body: 'High-resilience foam layers over kiln-dried teak, sheesham & hardwood frames.' },
  { icon: Hammer, title: 'Factory Direct', body: 'From our own workshop to your home — zero middlemen, honest pricing.' },
  { icon: Truck, title: 'Pan-India Delivery', body: 'Regional same-week delivery across Telangana & Andhra, shipping nationwide.' },
  { icon: ShieldCheck, title: '5–10 Year Warranty', body: 'Industry-leading warranty on every frame, mechanism and mattress core.' },
]

export default function CraftsmanshipStory() {
  return (
    <section id="craft" className="relative mx-auto max-w-7xl px-6 py-28">
      <p className="text-xs tracking-[0.35em] text-brass uppercase">Why Mokshaa</p>
      <RevealText
        text="Built by hand. Backed for a decade."
        className="mt-4 font-display text-4xl sm:text-6xl leading-tight"
      />
      <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-oat bg-oat/60 shadow-studio sm:grid-cols-2 lg:grid-cols-5">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="group bg-white p-7 hover:bg-linen transition-colors">
            <Icon size={26} className="text-brass" />
            <h3 className="mt-4 font-display text-xl text-obsidian">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 grid gap-10 lg:grid-cols-3">
        {[
          ['01 · Joinery', 'Mortise-and-tenon joints, corner-blocked and screwed — frames that outlive trends.'],
          ['02 · Comfort Core', 'Multi-layer HR foam with memory or pocket-spring options, calibrated per sleeper.'],
          ['03 · Finishing', 'Hand-sanded stains, French polish and stain-guard upholstery as standard.'],
        ].map(([kicker, body]) => (
          <div key={kicker}>
            <p className="text-xs tracking-[0.3em] text-teak uppercase mb-3">{kicker}</p>
            <RevealText as="div" text={body} className="text-slate leading-relaxed" />
          </div>
        ))}
      </div>
    </section>
  )
}
