/**
 * Stylised product previews rendered entirely with CSS + inline SVG.
 * No imagery, no video, no fabricated product names or metrics.
 */

function WindowChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <div className="flex gap-1.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong/70" />
        <span className="size-2 rounded-full bg-brand-300" />
      </div>
      <span className="font-mono text-2xs tracking-wide text-ink-faint">{label}</span>
    </div>
  );
}

/** Primary layer: SaaS platform dashboard. */
export function PlatformPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
      <WindowChrome label="platform" />

      <div className="flex gap-3 p-4">
        <div className="hidden w-24 shrink-0 flex-col gap-2 sm:flex">
          {["Overview", "Analytics", "Billing", "Settings"].map((item, index) => (
            <div
              key={item}
              className={`rounded-lg px-2.5 py-1.5 text-2xs font-medium ${
                index === 0 ? "bg-brand-50 text-brand-700" : "text-ink-faint"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-24 rounded-pill bg-canvas-deep" />
            <div className="h-5 w-14 rounded-pill bg-brand-500/15" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Users", "Retention", "Revenue"].map((label) => (
              <div key={label} className="rounded-xl border border-line bg-canvas/60 p-2.5">
                <div className="h-1.5 w-10 rounded-pill bg-line-strong" />
                <div className="mt-2 h-2 w-14 rounded-pill bg-ink/15" />
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-xl border border-line bg-canvas/60 p-3">
            <svg viewBox="0 0 240 72" className="h-16 w-full" fill="none" aria-hidden>
              <defs>
                <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#00BC85" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#00BC85" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 58C22 54 30 40 48 42c18 2 24 12 40 6 16-6 20-24 38-26 18-2 22 16 38 14 16-2 22-18 36-20 14-2 24 4 40-6v62H0z"
                fill="url(#hero-area)"
              />
              <path
                d="M0 58C22 54 30 40 48 42c18 2 24 12 40 6 16-6 20-24 38-26 18-2 22 16 38 14 16-2 22-18 36-20 14-2 24 4 40-6"
                stroke="#00A271"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex h-12 items-end gap-1.5">
            {[38, 62, 46, 78, 55, 88, 70, 96, 64, 82].map((height, index) => (
              <div
                key={index}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-t-[3px] ${
                  index > 6 ? "bg-brand-400/70" : "bg-brand-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Floating layer: live analytics module. */
export function AnalyticsPreview() {
  return (
    <div className="w-44 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-lg backdrop-blur-sm sm:w-52">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xs tracking-wide text-ink-faint uppercase">Live</span>
        <span className="flex items-center gap-1.5 text-2xs font-medium text-brand-700">
          <span className="size-1.5 rounded-full bg-brand-500" />
          Active
        </span>
      </div>

      <div className="mt-3 h-1.5 w-16 rounded-pill bg-line-strong" />

      <svg viewBox="0 0 120 34" className="mt-3 h-9 w-full" fill="none" aria-hidden>
        <path
          d="M2 28c10-2 12-12 20-12s10 8 18 6 12-14 20-12 10 10 18 8 12-10 20-8"
          stroke="#00BC85"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-3 flex gap-1.5">
        {[70, 45, 88, 60].map((height, index) => (
          <div
            key={index}
            style={{ height }}
            className="h-6 flex-1 rounded-sm bg-brand-200"
          />
        ))}
      </div>
    </div>
  );
}

/** Floating layer: video / build-log player. */
export function VideoPreview() {
  return (
    <div className="w-48 overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-lg backdrop-blur-sm sm:w-56">
      <div className="relative aspect-16/10 bg-gradient-to-br from-brand-100 via-canvas-soft to-brand-50">
        <div className="absolute inset-0 bg-[radial-gradient(1.5rem_1rem_at_30%_25%,rgb(255_255_255/0.9),transparent)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-ink/90 shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill="white" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="space-y-2 p-3.5">
        <div className="h-1.5 w-3/4 rounded-pill bg-canvas-deep" />
        <div className="h-1.5 w-1/2 rounded-pill bg-canvas-deep/70" />
        <div className="mt-3 h-1 w-full overflow-hidden rounded-pill bg-line">
          <div className="relative h-full w-2/5 overflow-hidden rounded-pill bg-brand-500">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}