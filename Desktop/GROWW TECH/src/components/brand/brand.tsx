import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

type BrandProps = {
  className?: string;
  markClassName?: string;
  /** Hide the wordmark and render only the mark. */
  markOnly?: boolean;
};

/** Geometric GROWW monogram: rounded tile, ascending arrow, green gradient. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-[0.7rem] bg-ink shadow-sm",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="groww-mark" x1="2" y1="22" x2="22" y2="2">
            <stop stopColor="#00BC85" />
            <stop offset="1" stopColor="#71E2B9" />
          </linearGradient>
        </defs>
        <path
          d="M5 18.5 11 6l3 6 1.6-3L20 18.5"
          stroke="url(#groww-mark)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Full wordmark used in the header and footer. */
export function Brand({ className, markClassName, markOnly }: BrandProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      {markOnly ? null : (
        <span className="font-display text-base font-semibold tracking-tight text-ink">
          {siteConfig.name}
        </span>
      )}
    </span>
  );
}
