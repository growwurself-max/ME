import { cn } from "@/lib/cn";

/** Soft radial accent glow. Purely decorative. */
export function GlowOrb({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "neutral";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 animate-drift rounded-full blur-3xl",
        tone === "brand"
          ? "bg-brand-200/45"
          : "bg-canvas-deep/70",
        className,
      )}
    />
  );
}

/** Faint technical grid used behind hero / showcase areas. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        "[mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in oklab, var(--color-line-strong) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-line-strong) 55%, transparent) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }}
    />
  );
}

/** Hairline divider that fades at both edges. */
export function SoftDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-line-strong to-transparent",
        className,
      )}
    />
  );
}
