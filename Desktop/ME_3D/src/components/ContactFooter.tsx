import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { CONTACT } from '../data/products'
import RevealText from './RevealText'
import MagneticButton from './MagneticButton'

export default function ContactFooter({ onQuote }: { onQuote: () => void }) {
  return (
    <footer id="contact" className="border-t border-oat bg-linen/40">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs tracking-[0.35em] text-brass uppercase">Visit Our Showroom</p>
        <RevealText text="Two locations. One promise." className="mt-4 font-display text-4xl sm:text-6xl" />

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-oat shadow-studio bg-white p-2">
            <iframe
              title="Mokshaa Enterprises Hyderabad location"
              src={CONTACT.mapEmbed}
              className="h-[340px] w-full rounded-2xl grayscale contrast-[1.02] opacity-90"
              loading="lazy"
            />
          </div>

          <div className="space-y-5">
            {[
              {
                icon: MapPin,
                title: 'Hyderabad (Flagship)',
                body: CONTACT.addressPrimary,
              },
              { icon: MapPin, title: 'Andhra Pradesh Branch', body: CONTACT.addressBranch },
              {
                icon: Phone,
                title: 'Call Us',
                body: CONTACT.phones.join('  ·  '),
              },
              { icon: Mail, title: 'Email', body: CONTACT.emails.join('  ·  ') },
              { icon: Clock, title: 'Hours', body: 'Mon – Sun · 10:00 AM – 9:00 PM' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-oat bg-white p-5 shadow-glass">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/30 text-brass">
                  <Icon size={17} />
                </span>
                <div>
                  <h4 className="text-sm font-semibold tracking-wide text-obsidian">{title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-5 rounded-3xl border border-brass/25 bg-white p-10 shadow-studio-lg text-center">
          <h3 className="font-display text-3xl sm:text-4xl text-obsidian">Ready to design your space?</h3>
          <p className="max-w-md text-sm text-slate">
            Share your room dimensions and preferences — our design team responds within hours on WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <MagneticButton
              onClick={onQuote}
              label="QUOTE"
              className="rounded-full bg-brass px-8 py-3.5 font-semibold text-white hover:shadow-[0_20px_40px_-15px_rgba(184,142,82,0.55)] transition-shadow"
            >
              Build My Custom Quote
            </MagneticButton>
            <MagneticButton
              href={CONTACT.whatsapp}
              label="CHAT"
              className="rounded-full border border-oat bg-white px-8 py-3.5 text-obsidian hover:border-brass hover:text-teak transition-colors"
            >
              Chat on WhatsApp
            </MagneticButton>
          </div>
        </div>
      </section>

      <div className="border-t border-oat py-8 text-center text-xs text-slate">
        © {new Date().getFullYear()} Mokshaa Enterprises · Jeedimetla, Hyderabad & Pentapadu, AP · Crafted with comfort in every dimension.
      </div>
    </footer>
  )
}
