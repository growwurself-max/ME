import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "brand" | "glass";
};

const toneMap = {
  neutral: "border-line bg-canvas-soft text-ink-muted",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  glass: "glass text-ink-muted",
} as const;

/** Small pill used for tags, filters and status labels. */
export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-2xs font-medium tracking-wide uppercase",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Mono uppercase eyebrow label used above section headings. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-2xs font-medium tracking-widest text-brand-700 uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
