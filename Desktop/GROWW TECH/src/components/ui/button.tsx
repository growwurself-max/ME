import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
};

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-pill font-medium tracking-tight whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-smooth active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

const variantMap: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-brand hover:bg-brand-500 hover:shadow-brand-lg",
  secondary:
    "border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:shadow-sm",
  ghost: "text-ink-muted hover:bg-canvas-soft hover:text-ink",
};

const sizeMap: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled,
  ariaLabel,
}: ButtonProps) {
  const classes = cn(base, variantMap[variant], sizeMap[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
