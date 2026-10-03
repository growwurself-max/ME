import { cn } from "@/lib/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
  interactive?: boolean;
};

/** Solid rounded card with a hairline ring and soft shadow. */
export function Card({ children, className, as: Tag = "div", interactive }: CardProps) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-surface shadow-xs",
        "transition-[transform,box-shadow,border-color] duration-500 ease-smooth",
        interactive &&
          "hover:-translate-y-1 hover:border-line-strong hover:shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Frosted glass card — sits over gradients / imagery. */
export function GlassCard({
  children,
  className,
  as: Tag = "div",
  interactive,
}: CardProps) {
  return (
    <Tag
      className={cn(
        "glass relative overflow-hidden rounded-2xl",
        "transition-[transform,box-shadow] duration-500 ease-smooth",
        interactive && "hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
