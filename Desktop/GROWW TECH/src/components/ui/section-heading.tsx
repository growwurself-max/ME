import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/badge";

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  headingClassName?: string;
};

/** Reusable section header. Content is always supplied by the caller. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  headingClassName,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "max-w-2xl text-3xl text-balance text-ink md:text-4xl",
          align === "center" && "mx-auto",
          headingClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-xl text-base text-pretty text-ink-muted",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
