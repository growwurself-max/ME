import { cn } from "@/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "main" | "article";
};

/** Page gutter + max width. */
export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return <Tag className={cn("container-site", className)}>{children}</Tag>;
}

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "canvas" | "soft" | "surface";
  spacing?: "sm" | "md" | "lg";
};

const toneMap = {
  canvas: "bg-canvas",
  soft: "bg-canvas-soft",
  surface: "bg-surface",
} as const;

const spacingMap = {
  sm: "py-18 md:py-22",
  md: "section-y",
  lg: "py-30 md:py-40",
} as const;

/** Vertical rhythm + optional surface tone. */
export function Section({
  children,
  className,
  id,
  tone = "canvas",
  spacing = "md",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24",
        toneMap[tone],
        spacingMap[spacing],
        className,
      )}
    >
      {children}
    </section>
  );
}
